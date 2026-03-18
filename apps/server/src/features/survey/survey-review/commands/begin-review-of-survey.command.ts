import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';

@TrueImpactDataExample<BeginReviewOfSurvey>({
  example: {
    surveyResponseRecordId: '55',
  },
})
export class BeginReviewOfSurvey {
  static readonly type = 'BEGIN_REVIEW_OF_SURVEY';

  @NonEmptyString({
    label: 'survey response ID',
    description:
      'a system identifier to the survey response you would like to review',
  })
  surveyResponseRecordId: string;
}
