import { SurveyResponseCompositeIdentifier } from '../../models';

export class SurveySubmittedPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}

export class SurveySubmitted {
  readonly type = 'SURVEY_SUBMITTED';

  readonly payload: SurveySubmittedPayload;

  constructor({ payload }: { payload: SurveySubmittedPayload }) {
    this.payload = payload;
  }
}
