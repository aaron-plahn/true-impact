import { NestedDataType, NonEmptyString } from '../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../survey-response-record.aggregate-root';

export class AnswerSurveyQuestion {
  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'composite identifier',
    description: 'a system-wide unique identifier for this survey attempt',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'user-facing label for this question',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description: 'label of the option the user has chosen for this question',
  })
  chosenOptionLabel: string;
}
