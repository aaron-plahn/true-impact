import { plainToInstance } from 'class-transformer';
import { NonEmptyString } from '../../../../../libs/data-types';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class ReviewOfResponseForSurveyQuestionAcknowledgedPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'identifies the question that has been reviewed',
  })
  questionLabel: string;
}

export class ReviewOfResponseForSurveyQuestionAcknowledged {
  readonly type = 'REVIEW_OF_RESPONSE_FOR_SURVEY_QUESTION_ACKNOWLEDGED';

  readonly payload: ReviewOfResponseForSurveyQuestionAcknowledgedPayload;

  constructor({
    payload,
  }: {
    payload: ReviewOfResponseForSurveyQuestionAcknowledgedPayload;
  }) {
    this.payload = plainToInstance(
      ReviewOfResponseForSurveyQuestionAcknowledgedPayload,
      payload,
    );
  }

  static fromPersistenceDto(
    dto: ReviewOfResponseForSurveyQuestionAcknowledged,
  ) {
    return new ReviewOfResponseForSurveyQuestionAcknowledged(dto);
  }
}
