import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
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

  // TODO @LookupTable
  // TSurveyAnalysisValue?
  valuesByCategory: Record<string, number>;
}
