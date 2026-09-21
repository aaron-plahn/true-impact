import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../models';

export class SurveyCompletionAbandonedPayload {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}

@TrueImpactDataExample<SurveyCompletionAbandoned>({
  example: {
    type: 'SURVEY_COMPLETION_ABANDONED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey response record',
        id: '1450',
      },
    },
  },
})
export class SurveyCompletionAbandoned {
  readonly type = 'SURVEY_COMPLETION_ABANDONED';

  readonly payload: SurveyCompletionAbandonedPayload;

  constructor({ payload }: { payload: SurveyCompletionAbandonedPayload }) {
    this.payload = plainToInstance(SurveyCompletionAbandonedPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyCompletionAbandoned) {
    return new SurveyCompletionAbandoned(dto);
  }
}
