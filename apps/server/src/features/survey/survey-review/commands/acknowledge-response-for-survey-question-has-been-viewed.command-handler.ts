import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { AcknowledgeResponseForSurveyQuestionHasBeenViewed } from './acknowledge-response-for-survey-question-has-been-viewed.command';
import type { ISurveyReviewCommandRepository } from './survey-review-command-repository.interface';

export class AcknowledgeResponseForSurveyQuestionHasBeenViewedCommandHandler implements ICommandHandler<AcknowledgeResponseForSurveyQuestionHasBeenViewed> {
  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyReviewCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      questionLabel,
    },
  }: {
    payload: AcknowledgeResponseForSurveyQuestionHasBeenViewed;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `You cannot acknowledge response for question [${questionLabel}] in survey attempt [${id}], as there is no such attempt.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const updated = existing.acknowledgeResponseToQuestionViewed(questionLabel);

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
