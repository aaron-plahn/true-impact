import { plainToInstance } from 'class-transformer';
import {
  LookupTable,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

// TODO We should consider an appraoch to schema management as we will need this later for versioning and change detection
export class ValueAddedForSurveyOptionPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'analyzer name',
    description:
      'identifies the analyzer whose calculation strategy is being updated',
  })
  analyzerName: string;

  @NonEmptyString({
    label: 'question label',
    description: 'identifies the question that has the relevant option',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description:
      'identifies the option which will emit the given values by category',
  })
  optionLabel: string;

  // could a type other than number be supported here?
  @LookupTable('number', {
    label: 'values by category',
    description:
      'assigns a numeric value for each of one or more categories that are accumulated when this option is chosen',
  })
  valuesByCategory: Record<string, number>;
}

@TrueImpactDataExample<ValueAddedForSurveyOption>({
  example: {
    type: 'VALUE_ADDED_FOR_SURVEY_OPTION',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '125',
      },
      analyzerName: 'My Test Analyzer',
      questionLabel: 'QL',
      optionLabel: 'OL',
      // You have to add at least one in your overrides
      valuesByCategory: {
        // blue: 22,
      },
    },
  },
})
/**
 * We could have called this `AnalysisValueAddedForSurveyOption`. But there is no
 * other kind of value that could apply to a survey option.
 */
export class ValueAddedForSurveyOption {
  readonly type = 'VALUE_ADDED_FOR_SURVEY_OPTION';

  readonly payload: ValueAddedForSurveyOptionPayload;

  constructor({ payload }: { payload: ValueAddedForSurveyOptionPayload }) {
    this.payload = plainToInstance(ValueAddedForSurveyOptionPayload, payload);
  }

  static fromPersistenceDto(dto: ValueAddedForSurveyOption) {
    return new ValueAddedForSurveyOption(dto);
  }
}
