import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class SurveyCreatedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  name: string;
  // languageCode?: string;
}

export class SurveyCreated {
  readonly type = 'SURVEY_CREATED';

  readonly payload: SurveyCreatedPayload;

  constructor(event: { payload: SurveyCreatedPayload }) {
    const { payload } = event;

    this.payload = payload;
  }

  static fromPersistenceDto(dto: SurveyCreated) {
    return new SurveyCreated(dto);
  }
}
