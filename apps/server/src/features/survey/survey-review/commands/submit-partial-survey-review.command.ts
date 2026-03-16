import { NestedDataType, NonEmptyString } from '../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../survey-completion';

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
