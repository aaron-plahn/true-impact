import {
  Literal,
  NestedDataType,
  NonEmptyString,
} from '../../../libs/data-types';
import { SURVEY_REVIEW_AGGREGATE_TYPE } from './constants';

export const SurveyReviewCompositeIdentifierValuedProp = NestedDataType(
  () => SurveyReviewCompositeIdentifier,
  {
    label: 'composite ID',
    /**
     * TODO We need to sort out the ubbiquitous language around survey completion.
     * We currently use several competing terms for the given domain model.
     * - Survey Response Record (perhaps only once submitted? perhaps for the view model \ report?)
     * - Survey Attempt (especially when in progress or if cancelled or abandoned)
     * - Survey Response (without the word Record)
     * - Survey Completion (submitted survey attempt; the act of participating in the survey response work flow)
     */
    description: 'system-wide unique identifier to a survey attempt',
  },
);

export class SurveyReviewCompositeIdentifier {
  @Literal(SURVEY_REVIEW_AGGREGATE_TYPE, {
    label: 'type',
    description: SURVEY_REVIEW_AGGREGATE_TYPE,
  })
  readonly type = SURVEY_REVIEW_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'unique identifier for this survey review',
  })
  id: string;
}
