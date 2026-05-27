import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyResponseRecord } from '../../survey-completion';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { SurveyReview } from '../survey-review.aggregate-root';
import { BeginReviewOfSurvey } from './begin-review-of-survey.command';
import type { ISurveyReviewCommandRepository } from './survey-review-command-repository.interface';

export interface ISurveyResponseValidationServiceForSurveyReviews {
  fetchForReview(
    surveyResponseId: string,
  ): Promise<SurveyResponseRecord | TrueImpactError>;
}

export class BeginReviewOfSurveyCommandHandler implements ICommandHandler<BeginReviewOfSurvey> {
  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyReviewRepository: ISurveyReviewCommandRepository,
    @Inject('SURVEY_RESPONSE_VALIDATION_SERVICE_INJECTION_TOKEN')
    private readonly surveyResponseValidator: ISurveyResponseValidationServiceForSurveyReviews,
  ) {}

  async handle({
    payload: { surveyResponseRecordId },
  }: {
    payload: BeginReviewOfSurvey;
  }): Promise<CommandResult> {
    const targetSurveyAttempt =
      await this.surveyResponseValidator.fetchForReview(surveyResponseRecordId);

    if (targetSurveyAttempt instanceof TrueImpactError) {
      return targetSurveyAttempt;
    }

    const newReview = SurveyReview.fromUserRequest({
      surveyResponseRecord: targetSurveyAttempt,
    }).validateInvariants();

    if (newReview instanceof TrueImpactError) {
      return newReview;
    }

    const persistenceResult =
      await this.surveyReviewRepository.create(newReview);

    return persistenceResult;
  }
}
