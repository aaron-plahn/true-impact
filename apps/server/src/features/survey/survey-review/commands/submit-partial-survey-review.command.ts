import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../survey-completion';

@TrueImpactDataExample<SubmitPartialSurveyReview>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey response record',
      id: '1',
    },
    reviewId: '2',
  },
})
export class SubmitPartialSurveyReview {
  static readonly type = 'SUBMIT_PARTIAL_SURVEY_REVIEW';

  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'unique sytem-wide reference to the survey attempt being reviewed',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NonEmptyString({
    label: 'review ID',
    description:
      'uniquely identifies the review being submitted amongst other reviews of the same survey',
  })
  reviewId: string;
}
