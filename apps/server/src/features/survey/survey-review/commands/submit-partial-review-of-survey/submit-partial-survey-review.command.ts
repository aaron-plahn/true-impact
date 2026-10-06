import { TrueImpactDataExample } from '../../../../../libs/data-types';
import {
  SurveyReviewCompositeIdentifier,
  SurveyReviewCompositeIdentifierValuedProp,
} from '../../survey-review.composite-identifier';

@TrueImpactDataExample<SubmitPartialSurveyReview>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey review',
      id: '1',
    },
  },
})
export class SubmitPartialSurveyReview {
  static readonly type = 'SUBMIT_PARTIAL_SURVEY_REVIEW';

  @SurveyReviewCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyReviewCompositeIdentifier;
}
