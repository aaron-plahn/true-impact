import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class CategoryAddedToSurveyAnalyzerPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  analyzerName: string;
  category: string;
}

export class CategoryAddedToSurveyAnalyzer {
  readonly type = 'CATEGORY_ADDED_TO_SURVEY_ANALYZER';

  readonly payload: CategoryAddedToSurveyAnalyzerPayload;

  constructor({ payload }: { payload: CategoryAddedToSurveyAnalyzerPayload }) {
    this.payload = plainToInstance(
      CategoryAddedToSurveyAnalyzerPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: CategoryAddedToSurveyAnalyzer) {
    return new CategoryAddedToSurveyAnalyzer(dto);
  }
}
