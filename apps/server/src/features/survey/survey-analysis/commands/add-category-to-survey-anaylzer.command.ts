import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SURVEY_AGGREGATE_TYPE } from '../../constants';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

@TrueImpactDataExample<AddCategoryToSurveyAnalyzer>({
  example: {
    aggregateCompositeIdentifier: {
      type: SURVEY_AGGREGATE_TYPE,
      id: '123',
    },
    category: 'red',
  },
})
export class AddCategoryToSurveyAnalyzer {
  static readonly type = 'ADD_CATEGORY_TO_SURVEY_ANALYZER';

  // implements IUpdateCommand

  @NestedDataType(() => SurveyCompositeIdentifier, {
    label: 'survey composite ID',
    description: `a globally unique reference to the target survey`,
  })
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  /**
   * TODO We might want to make this an ID in case we decide
   * to store the Categories separately.
   */
  @NonEmptyString({
    label: 'category',
    description: 'a label for the category you are adding',
  })
  category: string;

  //   description? languageCodeForDescription - how to handle this?

  // languageCode
}
