import { CreateClient } from './commands/create-client.command';
// TODO Barrel export?
import { FullName, FullNameDto } from '../../common/full-name';
import {
  AggregateRoot,
  isNonEmptyString,
  NonEmptyString,
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../libs/data-types';

interface ValidateInvariants<T> {
  // Should we make this an either?
  validateInvariants(): T | TrueImpactError;
}

export class ClientPersistenceDto {
  id: string;

  revision: number;

  fullName: FullNameDto;

  dateOfBirth: string; // Date?

  isIndigenous: 'Yes' | 'No' | 'Unknown'; // this is a smell

  community?: string;
}

export class Client
  extends AggregateRoot
  implements ValidateInvariants<Client>
{
  id: string;

  revision: number;

  fullName: FullName;

  dateOfBirth: string; // Date?

  isIndigenous: 'Yes' | 'No' | 'Unknown'; // Is there a better way to represent this?

  @NonEmptyString({
    label: 'Community',
    description: 'the Indigenous community to which the client is registered',
    isOptional: true,
    isArray: false,
  })
  community?: string;

  constructor({
    id,
    revision,
    fullName,
    dateOfBirth,
    isIndigenous,
    community,
  }: {
    id?: string;

    revision: number;

    fullName: FullNameDto;

    dateOfBirth: string; // Date?

    isIndigenous: 'Yes' | 'No' | 'Unknown'; // this is a smell

    community?: string;
  }) {
    super();

    if (typeof id !== 'undefined') {
      this.id = id;
    }

    if (typeof revision === 'number') {
      this.revision = revision;
    }

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

  toPersistenceDto(): ClientPersistenceDto {
    return JSON.parse(JSON.stringify(this)) as ClientPersistenceDto;
  }

  public static fromPersistenceDto(
    dto: ClientPersistenceDto,
    { shouldValidate }: { shouldValidate?: boolean } = {},
  ): Client | TrueImpactError {
    const result = new Client(dto);

    return shouldValidate ? result.validateInvariants() : result;
  }

  public static fromCreateClientCommand(
    command: CreateClient,
  ): Client | TrueImpactBadUserInputError {
    const { firstName, lastName, dateOfBirth, isIndigenous, community } =
      command;

    const unverifiedInstance = new Client({
      fullName: { firstName, lastName },
      dateOfBirth,
      isIndigenous,
      community,
      revision: 1,
    });

    const result = unverifiedInstance.validateInvariants();

    if (result instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([result]);
    }

    return result;
  }
}
