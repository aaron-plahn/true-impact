import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

// TODO We should consider an appraoch to schema management as we will need this later for versioning and change detection
export class ValueAddedForSurveyOptionPayload {
  // TODO add all decorators!
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  analyzerName: string;
  questionLabel: string;
  optionLabel: string;
  // could a type other than number be supported here?
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
