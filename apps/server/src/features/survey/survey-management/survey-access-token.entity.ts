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

  constructor({
    algorithm,
    hash,
    dateCreated,
    dateExpires,
  }: {
    algorithm: string;
    // we use a salt as part of the secrets
    hash: string;
    dateCreated: string;
    dateExpires: string;
  }) {
    this.algorithm = algorithm;
    this.hash = hash;
    this.dateCreated = dateCreated;
    this.dateExpires = dateExpires;
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
    });

    const invariantValidationErrors = instance.validateInvariants();

    if (invariantValidationErrors.length > 0) {
      return new TrueImpactBadUserInputError(invariantValidationErrors);
    }

    return instance;
  }
}
