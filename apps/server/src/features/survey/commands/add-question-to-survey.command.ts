import { NonEmptyString } from 'src/libs';
import { SurveyCompositeIdentifier } from '../survey.composite-identifier';

export class AddQuestionToSurvey {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'label',
    description: `a question's label distinguishes it from other questions in the same survey`,
    isArray: false,
    isOptional: false,
  })
  label: string;

  @NonEmptyString({
    label: 'prompt',
    description: 'user facing text for this question',
    isArray: false,
    isOptional: false,
  })
  prompt: string;
}
