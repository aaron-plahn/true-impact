import { NestedDataType, NonEmptyString } from '../../../../libs/data-types';
import { SurveyParticipantCompositeIdentifier } from '../survey-participant.composite-identifier';

export class BeginSurvey {
  // TODO @ReferenceTo or @OneToMany
  @NonEmptyString({
    label: 'survey ID',
    description: 'system identifier for the survey you are completing',
  })
  surveyId: string;

  // versionId: string; // an identifier specifying which version of this survey you are completing

  // TODO Should we have a separate `BeginAnonymousSurvey`?
  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'participant ID',
    description:
      'a system-wide unique reference to the person who is completing this survey',
  })
  participantCompositeIdentifier: SurveyParticipantCompositeIdentifier;
}
