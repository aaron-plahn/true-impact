import {
  NestedDataType,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../constants';
import { SurveyResponseCompositeIdentifier } from '../survey-response-record.aggregate-root';

@TrueImpactDataExample<AbandonSurveyCompletion>({
  example: {
    aggregateCompositeIdentifier: {
      id: '123',
      type: SURVEY_RESPONSE_AGGREGATE_TYPE,
    },
  },
})
export class AbandonSurveyCompletion {
  static readonly type = 'ABANDON_SURVEY_COMPLETION';

  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'composite identifier',
    description: 'a system-wide unique identifier for this survey attempt',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}
