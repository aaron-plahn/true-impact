import { CreateClient } from './commands/create-client.command';
// TODO Barrel export?
import { FullName, FullNameDto } from '../../common/full-name';
import {
  AggregateRoot,
  isNonEmptyString,
  NonEmptyString,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs/data-types';
import { CLIENT_AGGREGATE_TYPE } from './client.composite-identifier';

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

  flagIds: string[];
}

@TrueImpactDataExample<ClientPersistenceDto>({
  example: {
    id: '4',
    revision: 2,
    fullName: {
      firstName: 'James',
      middleName: 'Bob',
      lastName: 'Deer',
    },
    dateOfBirth: '2020-10-01',
    isIndigenous: 'Yes',
    flagIds: [],
  },
})
export class Client
  extends AggregateRoot
  implements ValidateInvariants<Client>
{
  static readonly type = CLIENT_AGGREGATE_TYPE;

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

  @NonEmptyString({
    label: 'flag IDs',
    description:
      'a reference to flags that indicate warnings or other context when interacting with the given client',
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  // We could change this to a set if we introduce a `Set` data type decorator.
  flagIds: string[];

  constructor({
    id,
    revision,
    fullName,
    dateOfBirth,
    isIndigenous,
    community,
    flagIds,
  }: {
    id?: string;

    revision: number;

    fullName: FullNameDto;

    dateOfBirth: string; // Date?

    isIndigenous: 'Yes' | 'No' | 'Unknown'; // this is a smell

    community?: string;

    flagIds: string[];
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

    this.flagIds = [...flagIds];
  }

  public getId() {
    return this.id;
  }

  hasFlag(flagId: string): boolean {
    return this.flagIds.includes(flagId);
  }

  @UpdateMethod()
  flag(flagId: string): Client | TrueImpactError {
    if (this.flagIds.includes(flagId)) {
      return new TrueImpactError(
        `You cannot flag client ${this.getName()} with the flag [${flagId}], as the client already has this flag.`,
      );
    }

    this.flagIds.push(flagId);

    return this;
  }

  getName(): string {
    return this.fullName.toString();
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    if (this.isIndigenous === 'No' && isNonEmptyString(this.community)) {
      allErrors.push(
        new TrueImpactError(
          `A non-indigenous client cannot be registered to a community [${this.community}]`,
        ),
      );
    }

    if (this.isIndigenous === 'Unknown' && isNonEmptyString(this.community)) {
      allErrors.push(
        new TrueImpactError(
          `When specifying a client's community [${this.community}], the client must be listed as Indigenous`,
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
    const {
      firstName,
      lastName,
      dateOfBirth,
      isIndigenous,
      communityId: community,
    } = command;

    const unverifiedInstance = new Client({
      fullName: { firstName, lastName },
      dateOfBirth,
      isIndigenous,
      community,
      revision: 1,
      flagIds: [], // none to start with
    });

    const result = unverifiedInstance.validateInvariants();

    if (result instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([result]);
    }

    return result;
  }
}
