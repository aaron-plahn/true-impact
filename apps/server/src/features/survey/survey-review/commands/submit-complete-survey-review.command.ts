import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyReviewCompositeIdentifier } from '../survey-review.composite-identifier';

@TrueImpactDataExample<SubmitCompleteSurveyReview>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey review',
      id: '3',
    },
    reviewId: '4',
  },
})
export class SubmitCompleteSurveyReview {
  static readonly type = 'SUBMIT_COMPLETE_SURVEY_REVIEW';

  @NestedDataType(() => SurveyReviewCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'unique sytem-wide reference to the survey attempt being reviewed',
  })
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;

  @NonEmptyString({
    label: 'review ID',
    description:
      'uniquely identifies the review being submitted amongst other reviews of the same survey',
  })
  reviewId: string;
}
