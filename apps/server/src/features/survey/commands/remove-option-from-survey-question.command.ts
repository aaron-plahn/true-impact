import { NonEmptyString } from 'src/libs';
import { SurveyCompositeIdentifier } from '../survey.composite-identifier';

export class RemoveOptionFromSurveyQuestion {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description:
      'the label of the question from which an option will be removed',
    isArray: false,
    isOptional: false,
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description:
      'the label of the option to remove from the given survey question',
    isArray: false,
    isOptional: false,
  })
  optionLabel: string;
}
