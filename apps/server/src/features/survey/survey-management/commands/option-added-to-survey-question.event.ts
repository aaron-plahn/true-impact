import { plainToInstance } from 'class-transformer';
import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

export class OptionAddedToSurveyPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'Identifies the question to which an option is being added',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description:
      'Uniquely identifies the option amongst other options for this question',
  })
  optionLabel: string;

  @NonEmptyString({
    label: 'text',
    description: 'Text to be displayed for this option',
  })
  text: string;
}

@TrueImpactDataExample<OptionAddedToSurveyQuestion>({
  example: {
    type: 'OPTION_ADDED_TO_SURVEY_QUESTION',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'survey',
        id: '44',
      },
      questionLabel: '1',
      optionLabel: 'a',
      text: 'first test option',
    },
  },
})
export class OptionAddedToSurveyQuestion {
  readonly type = 'OPTION_ADDED_TO_SURVEY_QUESTION';

  readonly payload: OptionAddedToSurveyPayload;

  constructor({ payload }: { payload: OptionAddedToSurveyPayload }) {
    this.payload = plainToInstance(OptionAddedToSurveyPayload, payload);
  }

  static fromPersistenceDto(dto: OptionAddedToSurveyQuestion) {
    return new OptionAddedToSurveyQuestion(dto);
  }
}
