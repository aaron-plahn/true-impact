import { plainToInstance } from 'class-transformer';
import { NonEmptyString } from 'src/libs/data-types';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class SurveyQuestionFlaggedPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NonEmptyString({
    label: 'flag ID',
    description: `identifies the flag that the reviewer is raising due to the participant's response to this question`,
  })
  flagId: string;
}

export class SurveyQuestionFlagged {
  readonly type = 'SURVEY_QUESTION_FLAGGED';

  readonly payload: SurveyQuestionFlaggedPayload;

  constructor({ payload }: { payload: SurveyQuestionFlaggedPayload }) {
    this.payload = plainToInstance(SurveyQuestionFlaggedPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyQuestionFlagged) {
    return new SurveyQuestionFlagged(dto);
  }
}
