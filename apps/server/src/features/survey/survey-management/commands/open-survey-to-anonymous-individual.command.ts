import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../survey.composite-identifier';

@TrueImpactDataExample<OpenSurveyToAnonymousIndividual>({
  example: {
    aggregateCompositeIdentifier: {
      type: 'survey',
      id: '11',
    },
    // TODO Fix this
    deadline: '2025-01-01@1230',
  },
})
export class OpenSurveyToAnonymousIndividual {
  static readonly type = 'OPEN_SURVEY_TO_ANONYMOUS_INDIVIDUAL';

  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  // this will be required on the event and defaulted to a reasonable value based on the effective date
  // TIMESTAMP
  @NonEmptyString({
    label: 'deadline',
    description: 'date and time by which the survey must be completed',
    isOptional: true,
  })
  deadline?: string;
}
