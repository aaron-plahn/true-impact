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

  /**
   * If this is omitted, the option forms a `leaf` in the survey graph, i.e., it is a
   * "dead end".
   */
  @NonEmptyString({
    label: 'label of next question',
    description:
      'a reference to the question to show the user this option is chosen',
    isArray: false,
    // TODO ensure that (if applicable) is appended to the user facing \ API docs when presenting this schema
    isOptional: true,
  })
  nextQuestionLabel?: string;
}
