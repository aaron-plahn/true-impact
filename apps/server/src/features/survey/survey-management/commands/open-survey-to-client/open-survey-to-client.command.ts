import { SURVEY_AGGREGATE_TYPE } from '../../../../../features/survey/constants';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../../../../features/survey/survey.composite-identifier';
import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';

@TrueImpactDataExample<OpenSurveyToClient>({
  example: {
    aggregateCompositeIdentifier: {
      type: SURVEY_AGGREGATE_TYPE,
      id: '5',
    },
    clientId: '4444',
  },
})
export class OpenSurveyToClient {
  static readonly type = 'OPEN_SURVEY_TO_CLIENT';

  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  // TODO @ReferenceTo
  @NonEmptyString({
    label: 'client ID',
    description: 'the client who will participate in the survey',
  })
  clientId: string;

  // TODO support survey completion time limits
  //   deadline?:
}
