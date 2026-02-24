import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
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
          `Failed to add question to survey [${id}], as there is no survey with this ID`,
        ),
      ]);

    if (searchResult instanceof TrueImpactError) {
      return searchResult;
    }

    const updatedSurvey = searchResult.addTopLevelQuestion({ label, prompt });

    if (updatedSurvey instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([updatedSurvey]);
    }

    const persistenceResult = await this.surveyRepository.update(updatedSurvey);

    return persistenceResult;
  }
}
