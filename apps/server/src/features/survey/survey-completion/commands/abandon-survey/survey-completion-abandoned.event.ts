import { SurveyResponseCompositeIdentifier } from '../../models';

export class SurveyCompletionAbandonedPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}

export class SurveyCompletionAbandoned {
  readonly type = 'SURVEY_COMPLETION_ABANDONED';

  readonly payload: SurveyCompletionAbandonedPayload;

  constructor({ payload }: { payload: SurveyCompletionAbandonedPayload }) {
    this.payload = payload;
  }
}
