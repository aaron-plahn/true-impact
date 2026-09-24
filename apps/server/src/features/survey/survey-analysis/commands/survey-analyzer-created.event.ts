import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class SurveyAnalyzerCreatedPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  name: string; // multilingual text item?
  // language code?
}

@TrueImpactDataExample<SurveyAnalyzerCreated>({
  example: {
    type: 'SURVEY_ANALYZER_CREATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '55',
      },
      name: 'My Test Survey',
    },
  },
})
// TODO rename the command `CreateSurveyAnalyzer`
export class SurveyAnalyzerCreated {
  readonly type = 'SURVEY_ANALYZER_CREATED';

  readonly payload: SurveyAnalyzerCreatedPayload;

  constructor({ payload }: { payload: SurveyAnalyzerCreatedPayload }) {
    this.payload = plainToInstance(SurveyAnalyzerCreatedPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyAnalyzerCreated) {
    return new SurveyAnalyzerCreated(dto);
  }
}
