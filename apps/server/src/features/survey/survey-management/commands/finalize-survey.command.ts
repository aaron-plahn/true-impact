import { TrueImpactDataExample } from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

@TrueImpactDataExample({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '1',
    },
  },
})
export class FinalizeSurvey {
  static readonly type = 'FINALIZE_SURVEY';

  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}
