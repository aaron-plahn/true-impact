import { Literal, NonEmptyString } from '../../../../libs/data-types';

/**
 * We inject this user in the middleware to make the
 * auth guard more readable in this case and to follow a
 * consistent approach to that used for ordinary system-user sessions.
 */
export class AnonymousSurveyParticipantUser {
  @Literal('ANONYMOUS_SURVEY_PARTICIPANT', {
    label: 'type',
    description:
      'distinguishes this from other kinds of users in our system (primarily in middleware)',
  })
  type = 'ANONYMOUS_SURVEY_PARTICIPANT';

  @NonEmptyString({
    label: 'survey response ID',
    description:
      'the ID of the one and only survey attempt this user can access',
  })
  surveyResponseId: string;

  constructor({ surveyResponseId }: { surveyResponseId: string }) {
    this.surveyResponseId = surveyResponseId;
  }
}
