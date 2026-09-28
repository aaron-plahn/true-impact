import { plainToInstance } from 'class-transformer';
import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

export class CategoryAddedToSurveyAnalyzerPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'analyzer name',
    description: 'identifies the analyzer the new category belongs to',
  })
  analyzerName: string;

  @NonEmptyString({
    label: 'category',
    description:
      'a category is quanitfiable and recieves a running total over all its values per option',
  })
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
