import { plainToInstance } from 'class-transformer';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class ReviewOfSurveyBeganPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;
}

export class ReviewOfSurveyBegan {
  readonly type = 'REVIEW_OF_SURVEY_BEGAN';

  readonly payload: ReviewOfSurveyBeganPayload;

  constructor({ payload }: { payload: ReviewOfSurveyBeganPayload }) {
    this.payload = plainToInstance(ReviewOfSurveyBeganPayload, payload);
  }

  static fromPersistenceDto(dto: ReviewOfSurveyBegan) {
    return new ReviewOfSurveyBegan(dto);
  }
}
