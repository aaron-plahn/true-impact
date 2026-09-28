import { plainToInstance } from 'class-transformer';
import { NonEmptyString } from 'src/libs/data-types';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../survey.composite-identifier';

export class SurveyOpenedToAnonymousParticipantPayload {
  @SurveyCompositeIdentifierValuedProp
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
  // @Unix timestamp?
  @NonEmptyString({
    label: 'date opened',
    description:
      'the date and time the survey was opened to an anonymous participant',
  })
  dateOpened: string;

  @NonEmptyString({
    label: 'expiration date',
    description: 'deadline for the participant to begin the survey',
  })
  dateOfExpiry: string;

  @NonEmptyString({
    label: 'hashed access code',
    description:
      // This is sent to the user in the clear
      'hashed (encrypted) copy of the access code redeemable for a survey attempt session',
  })
  hash: string;

  @NonEmptyString({
    label: 'hashing algorithm',
    description: 'which algorithm was used to hash the access token?',
  })
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
