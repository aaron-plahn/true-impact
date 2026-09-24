import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

export class CategoryAddedToSurveyAnalyzerPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  analyzerName: string;
  category: string;
}

@TrueImpactDataExample<CategoryAddedToSurveyAnalyzer>({
  example: {
    type: 'CATEGORY_ADDED_TO_SURVEY_ANALYZER',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '11',
      },
      analyzerName: 'My Test Survey Analyzer',
      category: 'test survey analysis category',
    },
  },
})
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
