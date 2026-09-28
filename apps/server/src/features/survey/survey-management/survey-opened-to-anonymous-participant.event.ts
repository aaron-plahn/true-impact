import { plainToInstance } from 'class-transformer';
import { SurveyCompositeIdentifier } from '../survey.composite-identifier';

export class SurveyOpenedToAnonymousParticipantPayload {
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;
  /**
   * We need to pull this from the event metadata. As long as it is
   * on the payload, it must be taken as the source of truth for
   * `dateEffective` for this event.
   *
   * The tricky thing is that in order to apply the event to
   * an aggregate root, the metadata must already be on the event.
   *
   * One way to solve this is to append the metadata in the domain
   * model and to avoid overwriting existing timestamps on metadata
   * at the higher level.
   */
  dateOpened: string;
  dateOfExpiry: string;
  hash: string;
  algorithm: string;
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
