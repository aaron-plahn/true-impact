import { plainToInstance } from 'class-transformer';
import { SurveyParticipantCompositeIdentifier } from '../../../../../features/survey/survey-completion/models';
import { SurveyCompositeIdentifier } from '../../../../../features/survey/survey.composite-identifier';

export class SurveyOpenedToParticipantPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  participantCompositeIdentifier: SurveyParticipantCompositeIdentifier;
  dateCreated: string;
  dateExpires: string;
  hash: string;
  algorithm: string;
}

/**
 * Note that this is generic over all possible participant types, not specific
 * to `clients` as participants.
 */
export class SurveyOpenedToParticipant {
  readonly type = 'SURVEY_OPENED_TO_PARTICIPANT';

  readonly payload: SurveyOpenedToParticipantPayload;

  constructor({ payload }: { payload: SurveyOpenedToParticipantPayload }) {
    this.payload = plainToInstance(SurveyOpenedToParticipantPayload, payload);
  }

  static fromPersistenceDto(dto: SurveyOpenedToParticipant) {
    return new SurveyOpenedToParticipant(dto);
  }
}
