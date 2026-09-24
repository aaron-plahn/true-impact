import { plainToInstance } from 'class-transformer';

export class SurveyAnalyzerCreatedPayload {
  aggregateCompositeIdentifier: {
    id: string;
    type: string;
  };
  name: string; // multilingual text item?
  // language code?
}

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
