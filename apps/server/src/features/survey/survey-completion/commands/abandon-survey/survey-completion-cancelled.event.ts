import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../models';

export class SurveyCompletionCancelledPayload {
  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'composite ID',
    description:
      'system-wide unique reference to the survey attempt that is being cancelled automatically due to a newer attempt',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NonEmptyString({
    label: 'next attempt ID',
    description:
      'a reference to the new attempt that triggered cancellation of this attempt in progress',
  })
  nextAttemptId: string;
}

/**
 * This is different from `SurveyCompletionAbandoned` because it is emitted automatically when the participant begins a new attempt of the
 * same survey.
 */
@TrueImpactDataExample<SurveyCompletionCancelled>({
  example: {
    type: 'SURVEY_COMPLETION_CANCELLED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey response record',
        id: '56',
      },
      nextAttemptId: '12345',
    },
  },
})
export class SurveyCompletionCancelled {
  readonly type = 'SURVEY_COMPLETION_CANCELLED';
  readonly payload: SurveyCompletionCancelledPayload;

  constructor({ payload }: { payload: SurveyCompletionCancelledPayload }) {
    this.payload = payload;
  }

  static fromPersistenceDto(dto: SurveyCompletionCancelled) {
    return new SurveyCompletionCancelled(dto);
  }
}
