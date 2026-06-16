import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../../libs/data-types';
import type { ISurveyResponseCommandRepository } from '../../repositories';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../repositories';
import { SubmitSurvey } from './submit-survey.command';

export class SubmitSurveyCommandHandler implements ICommandHandler<SubmitSurvey> {
  constructor(
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyResponseCommandRepository,
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

    const persistenceResult = await this.repository.update(updated);

    Object.assign(persistenceResult, { events: [updated.eventHistory.at(-1)] });

    return persistenceResult;
  }
}
