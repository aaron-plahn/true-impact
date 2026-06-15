import { SurveyResponseCompositeIdentifier } from '../models';

export class SurveyBeganPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}

export class SurveyBegan {
  readonly type = 'SURVEY_BEGAN';

  readonly payload: SurveyBeganPayload;

  // TODO META
  constructor({ payload }: { payload: SurveyBeganPayload }) {
    // Should this turn a DTO into an instance of the Survey Began Payload?
    this.payload = payload;
  }
}
