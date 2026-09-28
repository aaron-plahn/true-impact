import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

export class SurveyCreatedPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'name',
    description: `this survey's name (currently assumed to be in English)`,
  })
  name: string;

  // TODO support multilingual surveys
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
