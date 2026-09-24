import { plainToInstance } from 'class-transformer';
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

// TODO Why isn't the word `analyzer` in this name?
export class ValueAddedForSurveyOption {
  // TODO check that type and payload are always readonly
  readonly type = 'VALUE_ADDED_FOR_SURVEY_OPTION';

  readonly payload: ValueAddedForSurveyOptionPayload;

  constructor({ payload }: { payload: ValueAddedForSurveyOptionPayload }) {
    this.payload = plainToInstance(ValueAddedForSurveyOptionPayload, payload);
  }

  static fromPersistenceDto(dto: ValueAddedForSurveyOption) {
    return new ValueAddedForSurveyOption(dto);
  }
}
