// TODO Barrel export?
import { FullName, FullNameDto } from '../../common/full-name';
import {
  EventSourcedAggregateRoot,
  isNonEmptyString,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  RawObject,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs/data-types';

import { DomainEvent } from '../../libs/cqrs-es';
import {
  CalendarDate,
  CalendarDateDto,
  type YesNoOrUnknown,
} from '../../libs/data-types';
import {
  CLIENT_AGGREGATE_TYPE,
  ClientCompositeIdentifier,
} from './client.composite-identifier';
import {
  ClientCreated,
  ClientFlagged,
  CommunityAffiliationAddedForClient,
  CreateClient,
} from './commands';

interface ValidateInvariants<T> {
  // Should we make this an either?
  validateInvariants(): T | TrueImpactError;
}

export class ClientPersistenceDto {
  id: string;

  revision: number;

  fullName: FullNameDto;

  dateOfBirth: CalendarDateDto;

  isIndigenous: YesNoOrUnknown;

  communityId?: string;

  flagIds: string[];
}

@TrueImpactDataExample<ClientPersistenceDto>({
  example: {
    id: '4',
    revision: 2,
    fullName: {
      firstName: 'James',
      middleNames: ['Bob'],
      lastName: 'Deer',
    },
    dateOfBirth: CalendarDate.fromDateString('2020-10-01') as CalendarDate,
    isIndigenous: 'Yes',
    flagIds: [],
  },
})
export class Client
  extends EventSourcedAggregateRoot
  implements ValidateInvariants<Client>
{
  static readonly type = CLIENT_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'system identifier for this client',
  })
  id: string;

  @NonNegativeInteger({
    label: 'revision',
    description: 'tracks historical versions of this client',
  })
  // latestPersistedRevision?
  revision: number;

  @RawObject({
    label: 'event history',
    description: 'audit log containing all historical edits of this survey',
    isArray: true,
    // TODO rename this `canBeEmpty` for Array valued props?
    isOptional: true, // i.e. can be empty
  })
  eventHistory: DomainEvent[] = [];

  @NestedDataType(() => FullName, {
    label: 'full name',
    description: `the client's given name`,
  })
  fullName: FullName;

  @NestedDataType(() => CalendarDate, {
    label: 'date of birth',
    description: `the client's birth date`,
  })
  dateOfBirth: CalendarDate;

  // TODO Enum or `OneOf`
  @NonEmptyString({
    label: 'is Indigenous',
    description: 'Is the client Indigenous',
  })
  isIndigenous: YesNoOrUnknown; // Is there a better way to represent this?

  @NonEmptyString({
    label: 'Community',
    description: 'the Indigenous community to which the client is registered',
    isOptional: true,
    isArray: false,
  })
  communityId?: string;

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
    communityId,
    flagIds,
  }: {
    id: string;

    revision: number;

    fullName: FullNameDto;

    dateOfBirth: CalendarDateDto;

    isIndigenous: YesNoOrUnknown;

    communityId?: string;

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

    this.dateOfBirth = CalendarDate.fromPersitenceDto(
      dateOfBirth,
    ) as CalendarDate;

    this.isIndigenous = isIndigenous;

    this.communityId = communityId;

    this.flagIds = [...flagIds];
  }

  public getId() {
    return this.id;
  }

  hasFlag(flagId: string): boolean {
    return this.flagIds.includes(flagId);
  }

  @UpdateMethod()
  addCommunityAffiliation(communityId: string): Client | TrueImpactError {
    if (isNonEmptyString(this.communityId)) {
      return new TrueImpactError(
        `You cannot add community [${communityId}] for client [${this.id}], as the client is already listed as being registered to [${this.communityId}]`,
      );
    }

    if (this.isIndigenous === 'No') {
      return new TrueImpactError(
        `You cannot add a community for a non-indigenous client`,
      );
    }

    return this.apply(
      new CommunityAffiliationAddedForClient({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
          communityId,
        },
      }),
    );
  }

  handleCommunityAffiliationAddedForClient({
    payload: { communityId },
  }: CommunityAffiliationAddedForClient) {
    this.communityId = communityId;

    this.isIndigenous = 'Yes';

    return this;
  }

  @UpdateMethod()
  flag(flagId: string): Client | TrueImpactError {
    if (this.flagIds.includes(flagId)) {
      return new TrueImpactError(
        `You cannot flag client ${this.getName()} with the flag [${flagId}], as the client already has this flag.`,
      );
    }

    return this.apply(
      new ClientFlagged({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
          flagId,
        },
      }),
    );
  }

  handleClientFlagged({ payload: { flagId } }: ClientFlagged) {
    this.flagIds.push(flagId);

    return this;
  }

  getName(): string {
    return this.fullName.toString();
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    if (this.isIndigenous === 'No' && isNonEmptyString(this.communityId)) {
      allErrors.push(
        new TrueImpactError(
          `A non-indigenous client cannot be registered to a community [${this.communityId}]`,
        ),
      );
    }

    if (this.isIndigenous === 'Unknown' && isNonEmptyString(this.communityId)) {
      allErrors.push(
        new TrueImpactError(
          `When specifying a client's community [${this.communityId}], the client must be listed as Indigenous`,
        ),
      );
    }

    return allErrors;
  }

  getCompositeIdentifier(): ClientCompositeIdentifier {
    return {
      type: CLIENT_AGGREGATE_TYPE,
      id: this.id,
    };
  }

  toPersistenceDto(): ClientPersistenceDto {
    return JSON.parse(JSON.stringify(this)) as ClientPersistenceDto;
  }

  public static fromClientCreated(event: ClientCreated) {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
        fullName,
        dateOfBirth,
        isIndigenous,
        communityId,
      },
    } = event;

    const fullNameBuild = FullName.fromDto(fullName);

    if (fullNameBuild instanceof Error) {
      return fullNameBuild;
    }

    const dateOfBirthBuild = CalendarDate.fromDateString(dateOfBirth);

    if (dateOfBirthBuild instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(`Invalid birth date provided for a client.`),
        dateOfBirthBuild,
      ]);
    }

    const instance = new Client({
      id,
      revision: 1,
      fullName: fullNameBuild,
      dateOfBirth: dateOfBirthBuild,
      isIndigenous:
        typeof isIndigenous === 'undefined' ? 'Unknown' : isIndigenous,
      communityId,
      flagIds: [],
    });

    instance.eventHistory.push(event);

    const validationResult = instance.validateInvariants();

    return validationResult;
  }

  public static fromEventHistory(
    eventHistory: Iterable<DomainEvent>,
  ): Client | TrueImpactError | null {
    return EventSourcedAggregateRoot.fromEventHistory.call(
      Client,
      eventHistory,
    ) as Client;
  }

  public static fromPersistenceDto(
    dto: ClientPersistenceDto,
    { shouldValidate }: { shouldValidate?: boolean } = {},
  ): Client | TrueImpactError {
    const result = new Client(dto);

    return shouldValidate ? result.validateInvariants() : result;
  }

  public static fromCreateClientCommand(
    command: CreateClient & { id: string },
  ): Client | TrueImpactBadUserInputError {
    const {
      id,
      firstName,
      lastName,
      dateOfBirth: dateOfBirthFromRequest,
      isIndigenous,
      communityId,
    } = command;

    /**
     * It may be better to have an internal `Date` utility class given that
     * the recommended approach is to manually validate date strings in JS. This
     * really feels like it should just be on the native `Date` API, but that is
     * a legacy API.
     */
    const dateParts = dateOfBirthFromRequest.split('-');

    if (dateParts.length !== 3) {
      return new TrueImpactError(
        `Invalid date format. Expected YYYY-MM-DD, but received ${dateParts.length} occurrences of "-".`,
      );
    }

    const [YYYY, MM, DD] = dateParts.map((part, index) => {
      try {
        return parseInt(part);
      } catch (_parseError) {
        let partLabel: string = 'Unsupported Part';

        if (index === 0) {
          partLabel = 'YYYY';
        }

        if (index === 1) {
          partLabel = 'MM';
        }

        if (index === 2) {
          partLabel = 'DD';
        }

        return new TrueImpactError(
          `Failed to parse ${partLabel} for a date. Invalid value: [${part}]`,
        );
      }
    });

    if (YYYY instanceof Error) {
      return YYYY;
    }

    // TODO We want to be the allowed range of dates to be configurable per use case.
    if (YYYY < 0 || YYYY > new Date().getFullYear()) {
      return new TrueImpactError(`Invalid year [${YYYY}] encountered in date.`);
    }

    if (MM instanceof Error) {
      return MM;
    }

    if (MM < 0 || MM > 11) {
      return new TrueImpactError(`Invalid month [${MM}] encountered in date.`);
    }

    if (DD instanceof Error) {
      return DD;
    }

    if (
      DD < 1 ||
      DD > 31 ||
      ([9, 4, 6, 11]
        .map((humanIndexedMonth) => humanIndexedMonth - 1)
        .includes(MM) &&
        DD > 30) ||
      (DD === 2 && DD > 29)
    ) {
      return new TrueImpactError(
        `Encountered an invalid day [${DD}] / month [${MM}] combination in date.`,
      );
    }

    const isLeapYear = new Date(YYYY, 1, 29).getMonth() === 1;

    if (MM === 1 && !isLeapYear && DD > 28) {
      return new TrueImpactError(
        `Invalid date encountered. ${YYYY} is not a leap year.`,
      );
    }

    const dateOfBirth = CalendarDate.fromDateString(`${YYYY}-${MM}-${DD}`);

    if (dateOfBirth instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(`Invalid birthdate for a client.`),
        dateOfBirth,
      ]);
    }

    const unverifiedInstance = new Client({
      id,
      fullName: { firstName, lastName, middleNames: [] },
      dateOfBirth,
      isIndigenous,
      communityId,
      revision: 1,
      flagIds: [], // none to start with
    });

    const result = unverifiedInstance.validateInvariants();

    if (result instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([result]);
    }

    result.eventHistory.push(
      new ClientCreated({
        payload: {
          aggregateCompositeIdentifier: result.getCompositeIdentifier(),
          fullName: FullName.fromDto({
            firstName,
            lastName,
            middleNames: [],
          }),
          dateOfBirth: dateOfBirth.toDateString(),
          isIndigenous: isNonEmptyString(isIndigenous)
            ? isIndigenous
            : 'Unknown',
          communityId,
        },
      }),
    );

    return result;
  }
}
