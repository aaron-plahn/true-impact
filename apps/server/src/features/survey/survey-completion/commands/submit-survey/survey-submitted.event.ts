import { TrueImpactDataExample } from '../../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../models';

export class SurveySubmittedPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}

@TrueImpactDataExample<SurveySubmitted>({
  example: {
    type: 'SURVEY_SUBMITTED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey response record',
        id: '555',
      },
    },
    // TODO dummy date.now
    metadata: { dateEffective: 12345 },
  },
})
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

  static fromPersistenceDto(dto: SurveySubmitted): SurveySubmitted {
    return new SurveySubmitted(dto);
  }
}
