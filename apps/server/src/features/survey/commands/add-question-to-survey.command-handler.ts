import { Inject } from '@nestjs/common';
import { TrueImpactBadUserInputError, TrueImpactError } from 'src/libs';
import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import type { ISurveyCommandRepository } from '../repositories';
import { AddQuestionToSurvey } from './add-question-to-survey.command';

export class AddQuestionToSurveyCommandHandler implements ICommandHandler<AddQuestionToSurvey> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyRepository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      label,
      prompt,
    },
  }: {
    payload: AddQuestionToSurvey;
  }): Promise<CommandResult> {
    const searchResult =
      (await this.surveyRepository.fetchById(id)) ||
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to update survey [${id}], as there is no survey with this ID`,
        ),
      ]);

    if (searchResult instanceof TrueImpactError) {
      return searchResult;
    }

    const updatedSurvey = searchResult.addTopLevelQuestion({ label, prompt });

    if (updatedSurvey instanceof TrueImpactError) {
      return updatedSurvey;
    }

    const persistenceResult = await this.surveyRepository.update(updatedSurvey);

    return persistenceResult;
  }
}
