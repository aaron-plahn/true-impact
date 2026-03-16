import { NestedDataType, NonEmptyString } from '../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../../survey-completion';

export class BeginReviewOfSurvey {
  static readonly type = 'BEGIN_REVIEW_OF_SURVEY';

  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'survey response composite ID',
    description:
      'system-wide unique reference to the completed survey you are reviewing',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  @NonEmptyString({
    label: 'survey response ID',
    description:
      'a system identifier to the survey response you would like to review',
  })
  surveyResponseId: string;
}
