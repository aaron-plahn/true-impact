import { CreateClient } from './commands/create-client.command';
// TODO Barrel export?
import { FullName, FullNameDto } from '../../common/full-name';
import {
  Entity,
  isNonEmptyString,
  NonEmptyString,
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../libs/data-types';

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

  getName(): string {
    return this.fullName.toString();
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

  toPersistenceDto(): ClientPeristenceDto {
    return JSON.parse(JSON.stringify(this)) as ClientPeristenceDto;
  }

  public static fromPersistenceDto(
    dto: ClientPeristenceDto,
  ): Client | TrueImpactError {
    const result = new Client(dto).validateInvariants();

    return result;
  }

  public static fromCreateClientCommand(
    command: CreateClient,
  ): Client | TrueImpactBadUserInputError {
    const result = Client.fromCreateClientCommand(command);

    return result;
  }
}
