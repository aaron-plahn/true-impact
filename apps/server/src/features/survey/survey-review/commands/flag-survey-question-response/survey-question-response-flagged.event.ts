import { plainToInstance } from 'class-transformer';
import { NonEmptyString } from '../../../../../libs/data-types';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

export class SurveyQuestionResponseFlaggedPayload {
  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: `identifies the question to which the participant's response is reason for concern`,
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'flag ID',
    description: `identifies the flag that the reviewer is raising due to the participant's response to this question`,
  })
  flagId: string;
}

export class SurveyQuestionResponseFlagged {
  readonly type = 'SURVEY_QUESTION_RESPONSE_FLAGGED';

  readonly payload: SurveyQuestionResponseFlaggedPayload;

  constructor({ payload }: { payload: SurveyQuestionResponseFlaggedPayload }) {
    this.payload = plainToInstance(
      SurveyQuestionResponseFlaggedPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: SurveyQuestionResponseFlagged) {
    return new SurveyQuestionResponseFlagged(dto);
  }
}
