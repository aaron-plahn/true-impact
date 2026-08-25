import { SurveyResponseCompositeIdentifier } from '../../models';

export class SurveySubmittedPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}

export class SurveySubmitted {
  readonly type = 'SURVEY_SUBMITTED';

  readonly payload: SurveySubmittedPayload;

  readonly metadata: {
    // Unix timestamp
    dateEffective: number;
  };

  constructor({
    metadata,
    payload,
  }: {
    metadata: { dateEffective: number };
    payload: SurveySubmittedPayload;
  }) {
    this.payload = payload;

    this.metadata = metadata;
  }
}
