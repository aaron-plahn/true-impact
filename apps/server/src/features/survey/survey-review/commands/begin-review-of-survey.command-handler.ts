import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import type { ISurveyResponseCommandRepository } from '../../survey-completion/repositories';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../survey-completion/repositories';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { SurveyReview } from '../survey-review.aggregate-root';
import { BeginReviewOfSurvey } from './begin-review-of-survey.command';
import type { ISurveyReviewCommandRepository } from './survey-review-command-repository.interface';

export class BeginReviewOfSurveyCommandHandler implements ICommandHandler<BeginReviewOfSurvey> {
  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyReviewRepository: ISurveyReviewCommandRepository,
    /**
     * Should we use a service for this?
     */
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyResponseRepository: ISurveyResponseCommandRepository,
  ) {}

  async handle({
    payload: { surveyResponseRecordId },
  }: {
    payload: BeginReviewOfSurvey;
  }): Promise<CommandResult> {
    const targetSurveyAttempt =
      (await this.surveyResponseRepository.fetchById(surveyResponseRecordId)) ||
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot review survey response [${surveyResponseRecordId}], as there is no such attempt`,
        ),
      ]);

    if (targetSurveyAttempt instanceof TrueImpactError) {
      return targetSurveyAttempt;
    }

    if (!targetSurveyAttempt.hasBeenSubmitted) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot review attempt [${surveyResponseRecordId}] of survey [${targetSurveyAttempt.survey.name}], as it has not been submitted by the paritcipant.`,
        ),
      ]);
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
