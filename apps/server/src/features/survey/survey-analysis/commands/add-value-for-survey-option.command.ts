import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { LookupTable } from '../../../../libs/data-types/schema-management/decorators/lookup-table.decorator';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

@TrueImpactDataExample<AddValueForSurveyOption>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '123',
    },
    analyzerName: 'balance check',
    questionLabel: '1',
    optionLabel: 'c',
    valuesByCategory: {},
  },
})
export class AddValueForSurveyOption {
  static readonly type = 'ADD_VALUE_FOR_SURVEY_OPTION';

  @NestedDataType(() => SurveyCompositeIdentifier, {
    label: 'composite ID',
    description: 'a system-wide unique identifier for this survey',
  })
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'target analyzer name',
    description: 'the analyzer for which we are adding a value',
  })
  analyzerName: string;

  @NonEmptyString({
    label: 'question label',
    description: 'the question whose option you are adding a value for',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description: 'the option you are adding a value for',
  })
  optionLabel: string;

  @LookupTable('number', {
    label: 'values by category',
    description:
      'holds values for zero or more of the categories used to analyze this survey',
  })
  // TSurveyAnalysisValue?
  valuesByCategory: Record<string, number>;
}
