import { Inject } from '../../../../libs/framework';

import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import { AddFollowUpQuestionForSurveyOption } from './add-follow-up-question-for-survey-option.command';

export class AddFollowUpQuestionForSurveyOptionCommandHandler implements ICommandHandler<AddFollowUpQuestionForSurveyOption> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyRepository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      optionLabel,
      questionLabel,
      followUpQuestionLabel,
      followUpQuestionPrompt,
    },
  }: {
    payload: AddFollowUpQuestionForSurveyOption;
  }): Promise<CommandResult> {
    const targetSurvey =
      (await this.surveyRepository.fetchById(id)) ||
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to add follow up question for option [${optionLabel}] of question [${questionLabel}] as there is no survey with the ID [${id}]`,
        ),
      ]);

    if (targetSurvey instanceof TrueImpactError) {
      return targetSurvey;
    }

    const updateResult = targetSurvey.addFollowUpQuestion({
      questionLabel,
      optionLabel,
      followUpQuestion: {
        label: followUpQuestionLabel,
        prompt: followUpQuestionPrompt,
      },
    });

    if (updateResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([updateResult]);
    }

    const result = await this.surveyRepository.update(updateResult);

    return result;
  }
}
