import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyReviewCompositeIdentifier } from '../survey-review.composite-identifier';

@TrueImpactDataExample<AcknowledgeResponseForSurveyQuestionHasBeenViewed>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey review',
      id: '1',
    },
    questionLabel: 'IV',
  },
})
export class AcknowledgeResponseForSurveyQuestionHasBeenViewed {
  static readonly type =
    'ACKNOWLEDGE_RESPONSE_FOR_SURVEY_QUESTION_HAS_BEEN_VIEWED';

  @NestedDataType(() => SurveyReviewCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'unique sytem-wide reference to the survey attempt being reviewed',
  })
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NonEmptyString({
    label: 'question label',
    description: 'the label of the question you have now viewed',
  })
  questionLabel: string;
}
