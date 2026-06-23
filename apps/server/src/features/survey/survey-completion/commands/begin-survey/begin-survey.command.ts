import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';

@TrueImpactDataExample<BeginSurvey>({
  example: {
    surveyId: '303',
    accessCode: '123456',
    // You must append this if you need it, as it is optional.
    // participantCompositeIdentifier: {
    //   type: CLIENT_AGGREGATE_TYPE,
    //   id: '55',
    // },
  },
})
export class BeginSurvey {
  static readonly type = 'BEGIN_SURVEY';

  // TODO @ReferenceTo or @OneToMany for schema (not validation) purposes?
  @NonEmptyString({
    label: 'survey ID',
    description: 'system identifier for the survey you are completing',
  })
  surveyId: string;

  // versionId: string; // an identifier specifying which version of this survey you are completing

  @NonEmptyString({
    label: 'access code',
    description: 'allows a user to respond to this survey',
  })
  accessCode: string;
}
