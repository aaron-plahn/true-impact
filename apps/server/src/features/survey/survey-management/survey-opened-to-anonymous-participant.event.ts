import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from '../survey.composite-identifier';

export class SurveyOpenedToAnonymousParticipantPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  // TODO is this not on the event metadata?
  dateOpened: string;
  dateExpires: string;
  hash: string;
}

export class SurveyOpenedToAnonymousParticipant {
  readonly type = 'SURVEY_OPENED_TO_ANONYMOUS_PARTICIPANT';

  readonly payload: SurveyOpenedToAnonymousParticipantPayload;

  constructor({
    payload,
  }: {
    payload: SurveyOpenedToAnonymousParticipantPayload;
  }) {
    this.payload = plainToInstance(
      SurveyOpenedToAnonymousParticipantPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: SurveyOpenedToAnonymousParticipant) {
    return new SurveyOpenedToAnonymousParticipant(dto);
  }
}
