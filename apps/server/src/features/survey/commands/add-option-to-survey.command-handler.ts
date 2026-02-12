import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import type { ISurveyCommandRepository } from '../repositories';
import { AddOptionToSurveyQuestion } from './add-option-to-survey-question.command';

export class AddOptionToSurveyQuestionCommandHandler implements ICommandHandler<AddOptionToSurveyQuestion> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyRepository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      optionLabel,
      questionLabel,
      text,
    },
  }: {
    payload: AddOptionToSurveyQuestion;
  }): Promise<CommandResult> {
    const targetSurvey =
      (await this.surveyRepository.fetchById(id)) ||
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to add option [${optionLabel}] to question [${questionLabel}] as there is no survey with the ID [${id}]`,
        ),
      ]);

    if (targetSurvey instanceof TrueImpactError) {
      return targetSurvey;
    }

    const updateResult = targetSurvey.addOptionToQuestion({
      questionLabel,
      optionLabel,
      text,
    });

    /**
     * TODO We need to decide where to wrap the error in a `TrueImpactBadUserInputError`, i.e., where it
     * becomes classified as bad user input. We could make the error originate as bad user input to avoid complexity upstream. On the other hand,
     * classifying the result as a 400 seems to belong at the controller or maybe service (command handler \ query service) layer. Let's solve this
     * ASAP to avoid artificial complexity.
     */
    if (updateResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([updateResult]);
    }

    /**
     * TODO We need to increment the revision number. A good pattern would be for the repository's
     * `update` method to return either an error (db writes can always fail!) or an acknowledgement with
     * the ID and revision number that we can bubble up. This ensures that the revision number is atomic
     * and consistent.
     *
     */
    // TODO The persistence layer should fail if the revision number on the update request does not match what is currently in the db (optimistic concurrency)
    await this.surveyRepository.update(updateResult);

    return {
      id: updateResult.id,
      // TODO track the revision number
      revision: 'oops',
    };
  }
}
