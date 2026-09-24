import { TrueImpactDataExample } from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class SurveyCreatedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  name: string;
  // languageCode?: string;
}

@TrueImpactDataExample<SurveyCreated>({
  example: {
    type: 'SURVEY_CREATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '345',
      },
      name: 'A Test Survey',
    },
  },
})
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
