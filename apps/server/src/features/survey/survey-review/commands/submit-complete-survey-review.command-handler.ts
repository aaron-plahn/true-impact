import { Inject } from '@nestjs/common';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from 'src/libs/data-types';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { SubmitCompleteSurveyReview } from './submit-complete-survey-review.command';
import type { ISurveyReviewCommandRepository } from './survey-review-command-repository.interface';

export class SubmitCompleteSurveyReviewCommandHandler implements ICommandHandler<SubmitCompleteSurveyReview> {
  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyReviewCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
    },
  }: {
    payload: SubmitCompleteSurveyReview;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `You cannot submit survey review [${id}] as there is no such review record.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const updated = existing.submitCompleteReview();

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
