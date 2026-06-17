import {
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../../libs/data-types';
import { SurveyParticipantCompositeIdentifier } from '../survey-completion/models';

export class SurveyAccessTokenPersistenceDto {
  algorithm: string;
  // we use a salt as part of the secrets
  hash: string;
  dateCreated: string;
  dateExpires: string;
  participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
}

@TrueImpactDataExample<SurveyAccessTokenPersistenceDto>({
  example: {
    algorithm: 'sha-123',
    hash: 'abc1234fake-hashed-access-token',
    dateCreated: '12345',
    dateExpires: '34567',
  },
})
export class SurveyAccessToken {
  algorithm: string;
  // we use a salt as part of the secrets
  hash: string;
  dateCreated: string;
  dateExpires: string;
  /**
   * Possession of the un-hashed one-time passcode allows a user to authenticate as the participant within the context of completing just this one survey.
   * It grants no access to any other system information such as previous survey submissions or client data.
   *
   * Eventually, we may give clients system accounts and require full authentication before completing a survey.
   */
  participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;

  constructor({
    algorithm,
    hash,
    dateCreated,
    dateExpires,
    participantCompositeIdentifier,
  }: {
    algorithm: string;
    // we use a salt as part of the secrets
    hash: string;
    dateCreated: string;
    dateExpires: string;
    participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
  }) {
    this.algorithm = algorithm;
    this.hash = hash;
    this.dateCreated = dateCreated;
    this.dateExpires = dateExpires;

    if (participantCompositeIdentifier) {
      this.participantCompositeIdentifier = participantCompositeIdentifier;
    }
  }

  validateInvariants(): TrueImpactError[] {
    return [];
  }

  // TODO should this validate invariants?
  static fromPersistenceDto(dto: SurveyAccessTokenPersistenceDto) {
    return new SurveyAccessToken(dto);
  }

  static openAnonymousIndividualAccess({
    dateCreated,
    dateExpires,
    hash,
    algorithm,
  }: {
    dateCreated: string;
    dateExpires: string;
    hash: string;
    algorithm: string;
  }): SurveyAccessToken | TrueImpactBadUserInputError {
    const instance = new SurveyAccessToken({
      algorithm,
      hash,
      dateCreated,
      dateExpires,
    });

    const invariantValidationErrors = instance.validateInvariants();

    if (invariantValidationErrors.length > 0) {
      return new TrueImpactBadUserInputError(invariantValidationErrors);
    }

    return instance;
  }

  static openParticipantAccess({
    algorithm,
    dateCreated,
    dateExpires,
    hash,
    participantCompositeIdentifier,
  }: {
    dateCreated: string;
    dateExpires: string;
    hash: string;
    algorithm: string;
    participantCompositeIdentifier: SurveyParticipantCompositeIdentifier;
  }): SurveyAccessToken | TrueImpactBadUserInputError {
    const instance = new SurveyAccessToken({
      algorithm,
      dateCreated,
      dateExpires,
      hash,
      participantCompositeIdentifier,
    });

    const invariantValidationErrors = instance.validateInvariants();

    if (invariantValidationErrors.length > 0) {
      return new TrueImpactBadUserInputError(invariantValidationErrors);
    }

    return instance;
  }
}
