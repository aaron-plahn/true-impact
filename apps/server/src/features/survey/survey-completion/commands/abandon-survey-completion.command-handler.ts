import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCompletionCommandRepository } from '../repositories';
import { AbandonSurveyCompletion } from './abandon-survey-completion.command';

export class AbandonSurveyCompletionCommandHandler implements ICommandHandler<AbandonSurveyCompletion> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: ISurveyCompletionCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
    },
  }: {
    payload: AbandonSurveyCompletion;
  }): Promise<CommandResult> {
    const existing = await this.repository.fetchById(id);

    if (!existing) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot abandon survey attempt [${id}], as there is no such survey.`,
        ),
      ]);
    }

    const updated = existing.abandon();

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    return this.repository.update(updated);
  }
}
