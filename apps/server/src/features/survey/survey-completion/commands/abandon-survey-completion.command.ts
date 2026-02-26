import { NestedDataType } from '../../../../libs/data-types';
import { SurveyResponseCompositeIdentifier } from '../survey-response-record.aggregate-root';

export class AbandonSurveyCompletion {
  @NestedDataType(() => SurveyResponseCompositeIdentifier, {
    label: 'composite identifier',
    description: 'a system-wide unique identifier for this survey attempt',
  })
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}
