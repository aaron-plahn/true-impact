import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import { AddCategoryToSurveyAnalyzer } from './add-category-to-survey-anaylzer.command';

export class AddCategoryToSurveyAnalyzerCommandHandler implements ICommandHandler<AddCategoryToSurveyAnalyzer> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      analyzerName,
      category,
    },
  }: {
    payload: AddCategoryToSurveyAnalyzer;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `You cannot add category [${category}] to analyzer [${analyzerName}] for survey [${id}], as there is no such survey.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const updateResult = existing.addCategoryForAnalyzer({
      category,
      analyzerName,
    });

    if (updateResult instanceof TrueImpactError) {
      return updateResult;
    }

    const persistenceResult = await this.repository.update(updateResult);

    return persistenceResult;
  }
}
