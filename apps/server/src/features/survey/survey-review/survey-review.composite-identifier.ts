import { NonEmptyString } from '../../../libs/data-types';
import { SURVEY_REVIEW_AGGREGATE_TYPE } from './constants';

export class SurveyReviewCompositeIdentifier {
  readonly type = SURVEY_REVIEW_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'unique identifier for this survey review',
  })
  id: string;
}
