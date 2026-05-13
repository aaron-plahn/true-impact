import { CLIENT_AGGREGATE_TYPE } from '../../../../features/clients/client.composite-identifier';
import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import { SurveyParticipantCompositeIdentifier } from '../models';

@TrueImpactDataExample<BeginSurvey>({
  example: {
    surveyId: '303',
    participantCompositeIdentifier: {
      type: CLIENT_AGGREGATE_TYPE,
      id: '55',
    },
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

  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'participant ID',
    description:
      'a system-wide unique reference to the person who is completing this survey',
    isOptional: true,
  })
  participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
}
