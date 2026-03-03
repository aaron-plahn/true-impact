import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import type { ISurveyCompletionCommandRepository } from '../repositories';
import { SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';
import { SubmitSurvey } from './submit-survey.command';

export class SubmitSurveyCommandHandler implements ICommandHandler<SubmitSurvey> {
  constructor(
    @Inject(SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyCompletionCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
    },
  }: {
    payload: SubmitSurvey;
  }): Promise<CommandResult> {
    const existing = await this.repository.fetchById(id);

    if (!existing) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot submit survey attempt [${id}] as there is no such attempt.`,
        ),
      ]);
    }

    const updated = existing.submit();

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    return this.repository.update(updated);
  }
}
