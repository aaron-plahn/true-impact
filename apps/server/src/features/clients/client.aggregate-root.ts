import { CreateClient } from './commands/create-client.command';
// TODO Barrel export?
import { FullName, FullNameDto } from '../../common/full-name';
import {
  Entity,
  isNonEmptyString,
  NonEmptyString,
  TrueImpactError,
} from '../../libs';

const GENERATE_A_NEW_ID = 'GENERATE_A_NEW_ID';

interface ValidateInvariants<T> {
  // Should we make this an either?
  validateInvariants(): T | TrueImpactError;
}

export class ClientPeristenceDto {
  id: string;

  fullName: FullNameDto;

  dateOfBirth: string; // Date?

  isIndigenous: 'Yes' | 'No' | 'Unknown'; // this is a smell

  community?: string;
}

export class Client extends Entity implements ValidateInvariants<Client> {
  id: string;

  fullName: FullName;

  dateOfBirth: string; // Date?

  isIndigenous: 'Yes' | 'No' | 'Unknown'; // this is a smell

  @NonEmptyString({
    label: 'Community',
    description: 'the Indigenous community to which the client is registered',
    isOptional: true,
    isArray: false,
  })
  community?: string;

  constructor({
    id,
    fullName,
    dateOfBirth,
    isIndigenous,
    community,
  }: ClientPeristenceDto) {
    super();

    this.id = id;

    this.fullName = FullName.fromDto(fullName);

    this.dateOfBirth = dateOfBirth;

    this.isIndigenous = isIndigenous;

    this.community = community;
  }

  public getId() {
    return this.id;
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    if (this.isIndigenous === 'No' && isNonEmptyString(this.community)) {
      allErrors.push(
        new TrueImpactError(
          `A non-indigenous client cannot be registered to a community`,
        ),
      );
    }

    if (this.isIndigenous === 'Unknown' && isNonEmptyString(this.community)) {
      allErrors.push(
        new TrueImpactError(
          `When specifying a client's community, the client must be listed as Indigenous`,
        ),
      );
    }

    return allErrors;
  }

  setInitialId(generatedId: string): Client | TrueImpactError {
    if (this.id !== GENERATE_A_NEW_ID) {
      return new TrueImpactError(
        `Cannot overwrite id: ${this.id} with generated ID: ${generatedId}`,
      );
    }

    this.id = generatedId;

    return this;
  }

  toPersistenceDto(): ClientPeristenceDto {
    return JSON.parse(JSON.stringify(this)) as ClientPeristenceDto;
  }

  public static fromPersistenceDto(
    dto: ClientPeristenceDto,
  ): Client | TrueImpactError {
    const result = new Client(dto).validateInvariants();

    return result;
  }

  public static fromCreateClientCommand({
    // TODO remove this
    // aggregateComposteIdentifier: { id: clientId },
    firstName,
    lastName,
    dateOfBirth,
    isIndigenous,
    community,
  }: CreateClient): Client | TrueImpactError {
    const unverifiedInstance = new Client({
      id: GENERATE_A_NEW_ID,
      fullName: { firstName, lastName },
      dateOfBirth,
      isIndigenous,
      community,
    });

    return unverifiedInstance.validateInvariants();
  }
}
