import {
  NestedDataType,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../constants';
import { SurveyResponseCompositeIdentifier } from '../survey-response-record.aggregate-root';

@TrueImpactDataExample<SubmitSurvey>({
  example: {
    aggregateCompositeIdentifier: {
      type: SURVEY_RESPONSE_AGGREGATE_TYPE,
      id: '123',
    },
  },
})
export class SubmitSurvey {
  static readonly type = 'SUBMIT_SURVEY';

  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'composite identifier',
    description: 'a system-wide unique identifier for this survey attempt',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}
