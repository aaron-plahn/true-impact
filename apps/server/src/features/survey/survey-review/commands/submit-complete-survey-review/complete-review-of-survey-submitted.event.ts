import { plainToInstance } from 'class-transformer';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class CompleteReviewOfSurveySubmittedPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;
}

export class CompleteReviewOfSurveySubmitted {
  readonly type = 'COMPLETE_REVIEW_OF_SURVEY_SUBMITTED';

  readonly payload: CompleteReviewOfSurveySubmittedPayload;

  constructor({
    payload,
  }: {
    payload: CompleteReviewOfSurveySubmittedPayload;
  }) {
    this.payload = plainToInstance(
      CompleteReviewOfSurveySubmittedPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: CompleteReviewOfSurveySubmitted) {
    return new CompleteReviewOfSurveySubmitted(dto);
  }
}
