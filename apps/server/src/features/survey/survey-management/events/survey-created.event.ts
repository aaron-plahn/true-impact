import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class SurveyCreatedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}

export class SurveyCreated {
  readonly type = 'SURVEY_CREATED';

  readonly payload: SurveyCreatedPayload;

  constructor({ payload }: { payload: SurveyCreatedPayload }) {
    this.payload = payload;

    // TODO introduce metadata now
  }
}
