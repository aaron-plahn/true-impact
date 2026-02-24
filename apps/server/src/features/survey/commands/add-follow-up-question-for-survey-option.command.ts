import { TrueImpactDataExample } from '../../../libs/data-types';
import { SurveyCompositeIdentifier } from '../survey.composite-identifier';

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

  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  questionLabel: string;

  optionLabel: string;

  followUpQuestionLabel: string;

  followUpQuestionPrompt: string;
}
