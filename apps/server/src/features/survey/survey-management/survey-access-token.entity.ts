import {
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../../libs/data-types';

export class SurveyAccessTokenPersistenceDto {
  algorithm: string;
  // we use a salt as part of the secrets
  hash: string;
  dateCreated: string;
  dateExpires: string;
  usesRemaining: number; // setting this to 0 immediately revokes the token
  // participantCompositeIdentifier
}

@TrueImpactDataExample<SurveyAccessTokenPersistenceDto>({
  example: {
    algorithm: 'sha-123',
    hash: 'abc1234fake-hashed-access-token',
    dateCreated: '12345',
    dateExpires: '34567',
    usesRemaining: 0,
  },
})
export class SurveyAccessToken {
  algorithm: string;
  // we use a salt as part of the secrets
  hash: string;
  dateCreated: string;
  dateExpires: string;
  usesRemaining: number; // setting this to 0 immediately revokes the token

  constructor({
    algorithm,
    hash,
    dateCreated,
    dateExpires,
    usesRemaining,
  }: {
    algorithm: string;
    // we use a salt as part of the secrets
    hash: string;
    dateCreated: string;
    dateExpires: string;
    usesRemaining: number;
  }) {
    this.algorithm = algorithm;
    this.hash = hash;
    this.dateCreated = dateCreated;
    this.dateExpires = dateExpires;
    this.usesRemaining = usesRemaining;
  }
  // participantCompositeIdentifier

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
      usesRemaining: 1,
    });

    const invariantValidationErrors = instance.validateInvariants();

    if (invariantValidationErrors.length > 0) {
      return new TrueImpactBadUserInputError(invariantValidationErrors);
    }

    return instance;
  }
}
