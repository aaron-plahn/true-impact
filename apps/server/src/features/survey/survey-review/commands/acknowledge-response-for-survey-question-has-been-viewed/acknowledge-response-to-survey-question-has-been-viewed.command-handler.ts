import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../../libs/data-types';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../constants';
import type { ISurveyReviewCommandRepository } from '../survey-review-command-repository.interface';
import { AcknowledgeResponseToSurveyQuestionHasBeenViewed } from './acknowledge-response-to-survey-question-has-been-viewed.command';

export class AcknowledgeResponseToSurveyQuestionHasBeenViewedCommandHandler implements ICommandHandler<AcknowledgeResponseToSurveyQuestionHasBeenViewed> {
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
    payload: AcknowledgeResponseToSurveyQuestionHasBeenViewed;
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
