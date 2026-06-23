import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../../survey.composite-identifier';

@TrueImpactDataExample<AddQuestionToSurvey>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '1',
    },
    label: 'My Test Survey Question',
    prompt: 'What is the best programming language?',
  },
})
export class AddQuestionToSurvey {
  static readonly type = 'ADD_QUESTION_TO_SURVEY';

  @NestedDataType(() => SurveyCompositeIdentifier, {
    label: 'composite ID',
    description: 'system-wide unique identifier to this survey',
  })
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
