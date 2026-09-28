import { plainToInstance } from 'class-transformer';
import { SurveyParticipantCompositeIdentifier } from '../../../../../features/survey/survey-completion/models/survey-participant.composite-identifier';
import {
  SurveyCompositeIdentifier,
  SurveyCompositeIdentifierValuedProp,
} from '../../../../../features/survey/survey.composite-identifier';
import { NestedDataType, NonEmptyString } from '../../../../../libs/data-types';

export class SurveyOpenedToParticipantPayload {
  @SurveyCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: SurveyCompositeIdentifier;

  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'participant composite ID',
    description: 'system-wide unique identifier for this survey participant',
  })
  participantCompositeIdentifier: SurveyParticipantCompositeIdentifier;

  // unix timestamp?
  @NonEmptyString({
    label: 'date created',
    description:
      'date and time at which the survey became available to the participant',
  })
  dateCreated: string;

  @NonEmptyString({
    label: 'expiration date',
    description: 'deadline for the participant to begin this survey',
  })
  dateExpires: string;

  @NonEmptyString({
    label: 'hashed access code',
    description:
      'hashed (encrypted) access code that was generated to share with the participant',
  })
  hash: string;

  @NonEmptyString({
    label: 'algorithm',
    description: 'which algorithm was used to generate the access code',
  })
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
