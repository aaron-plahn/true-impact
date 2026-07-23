import { SurveyParticipantCompositeIdentifier } from '../../../../../features/survey/survey-completion/models';
import { SurveyCompositeIdentifier } from '../../../../../features/survey/survey.composite-identifier';

export class SurveyOpenedToParticipantPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  participantCompositeIdentifier: SurveyParticipantCompositeIdentifier;
}

export class SurveyOpenedToParticipant {
  readonly type = 'SURVEY_OPENED_TO_PARTICIPANT';

  readonly payload: SurveyOpenedToParticipantPayload;

  constructor({ payload }: { payload: SurveyOpenedToParticipantPayload }) {
    this.payload = payload;
  }
}
