import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../../libs/data-types';
import {
  SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN,
  type ISurveyResponseCommandRepository,
} from '../../repositories';
import { AbandonSurveyCompletion } from './abandon-survey-completion.command';

export class AbandonSurveyCompletionCommandHandler implements ICommandHandler<AbandonSurveyCompletion> {
  constructor(
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyResponseCommandRepository,
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
          `You cannot abandon survey attempt [${id}], as there is no such attempt in progress.`,
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
