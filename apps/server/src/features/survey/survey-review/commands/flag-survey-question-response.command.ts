import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyReviewCompositeIdentifier } from '../survey-review.composite-identifier';

@TrueImpactDataExample<FlagSurveyQuestionResponse>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey review',
      id: '1',
    },
    reviewId: '2',
    questionLabel: 'XX',
    flagId: '145',
  },
})
export class FlagSurveyQuestionResponse {
  static readonly type = 'FLAG_SURVEY_QUESTION_RESPONSE';

  @NestedDataType(() => SurveyReviewCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'unique sytem-wide reference to the survey attempt being reviewed',
  })
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NonEmptyString({
    label: 'review ID',
    description:
      'uniquely identifies the review amongst other reviews of the same survey attempt',
  })
  reviewId: string;

  @NonEmptyString({
    label: 'question label',
    description: 'Which question are you flagging?',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'flag ID',
    description: `Which flag would you like to add to this question's response?`,
  })
  flagId: string;
}
