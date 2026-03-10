import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import { CreateAnalyzerForSurvey } from './create-analyzer-for-survey.command';

export class CreateAnalyzerForSurveyCommandHandler implements ICommandHandler<CreateAnalyzerForSurvey> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      name: analyzerName,
    },
  }: {
    payload: CreateAnalyzerForSurvey;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `Failed to create analyzer [${analyzerName}] for survey [${id}], as there is no such survey.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const updateResult = existing.createAnalyzer({ name: analyzerName });

    if (updateResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([updateResult]);
    }

    const persistenceResult = await this.repository.update(updateResult);

    return persistenceResult;
  }
}
