import { NonEmptyString, TrueImpactDataExample } from '../../../libs';
import { SurveyCompositeIdentifier } from '../survey.composite-identifier';

@TrueImpactDataExample<AddOptionToSurveyQuestion>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '1',
    },
    questionLabel: '1',
    optionLabel: 'a',
    text: 'I often feel happy with myself!',
  },
})
export class AddOptionToSurveyQuestion {
  static readonly type = 'ADD_OPTION_TO_SURVEY_QUESTION';

  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'the label for the question that will receive the new option',
    isArray: false,
    isOptional: false,
  })
  questionLabel: string;

  // This is a local identifier for the option within the context of a question
  @NonEmptyString({
    label: 'option label',
    description:
      'the label for this option distinguishes it from other options for the same question',
    isArray: false,
    isOptional: false,
  })
  optionLabel: string;

  // currently the languageCode is assumed to be 'en'
  @NonEmptyString({
    label: 'text',
    description: 'the text to display to the user for this option',
    isArray: false,
    isOptional: false,
  })
  text: string;
}
