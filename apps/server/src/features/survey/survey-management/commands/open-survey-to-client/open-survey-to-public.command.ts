import { SURVEY_AGGREGATE_TYPE } from '../../../../../features/survey/constants';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../../../../features/survey/survey.composite-identifier';
import { TrueImpactDataExample } from '../../../../../libs/data-types';

@TrueImpactDataExample<OpenSurveyToPublic>({
  example: {
    aggregateCompositeIdentifier: {
      type: SURVEY_AGGREGATE_TYPE,
      id: '5',
    },
  },
})
// TODO move this
export class OpenSurveyToPublic {
  static readonly type = 'OPEN_SURVEY_TO_PUBLIC';

  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
}
