import { plainToInstance } from 'class-transformer';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class PartialReviewOfSurveySubmittedPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;
}

export class PartialReviewOfSurveySubmitted {
  readonly type = 'PARTIAL_REVIEW_OF_SURVEY_SUBMITTED';

  readonly payload: PartialReviewOfSurveySubmittedPayload;

  constructor({ payload }: { payload: PartialReviewOfSurveySubmittedPayload }) {
    this.payload = plainToInstance(
      PartialReviewOfSurveySubmittedPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: PartialReviewOfSurveySubmitted) {
    return new PartialReviewOfSurveySubmitted(dto);
  }
}
