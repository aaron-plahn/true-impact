import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

@TrueImpactDataExample<AddFollowUpQuestionForSurveyOption>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '555',
    },
    questionLabel: '1',
    optionLabel: 'a',
    followUpQuestionLabel: '1.b',
    followUpQuestionPrompt: 'Why would you say such a thing?',
  },
})
export class AddFollowUpQuestionForSurveyOption {
  static readonly type = 'ADD_FOLLOW_UP_QUESTION_FOR_SURVEY_OPTION';

  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: `target question`,
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description: '`target option',
  })
  optionLabel: string;

  @NonEmptyString({
    label: 'follow up question label',
    description: 'the label to use for the new follow up question',
  })
  followUpQuestionLabel: string;

  @NonEmptyString({
    description: `user-facing prompt for the new follow up question`,
    label: 'follow up question prompt',
  })
  followUpQuestionPrompt: string;
}
