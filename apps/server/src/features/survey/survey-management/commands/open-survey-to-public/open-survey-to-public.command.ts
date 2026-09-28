import { TrueImpactDataExample } from '../../../../../libs/data-types';
import { SURVEY_AGGREGATE_TYPE } from '../../../constants';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../../survey.composite-identifier';

@TrueImpactDataExample<OpenSurveyToPublic>({
  example: {
    aggregateCompositeIdentifier: {
      type: SURVEY_AGGREGATE_TYPE,
      id: '5',
    },
  },
})
export class OpenSurveyToPublic {
  static readonly type = 'OPEN_SURVEY_TO_PUBLIC';

  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}
