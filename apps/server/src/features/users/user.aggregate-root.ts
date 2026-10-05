import { DomainEvent } from 'src/libs/cqrs-es';
import { FullName, FullNameDto } from '../../common/full-name';
import {
  BooleanDataType,
  EnumeratedType,
  EventSourcedAggregateRoot,
  Literal,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  RawObject,
  TrueImpactError,
  UpdateMethod,
} from '../../libs/data-types';
import { UserDeactivated, UserWithPasswordCreated } from './commands';
import { UserGrantedRole } from './commands/grant-user-role/user-granted-role.event';
import { userRoleValuesAndLabels, type UserRole } from './types';
import { USER_AGGREGATE_TYPE } from './user.composite-identifier';

const DEFAULT_ROLE: UserRole = 'employee';

// TODO do we really want this now?
export class UserPersistenceDto {
  id: string;
  isActive: boolean;
  email: string;
  hasEmailBeenValidated: boolean;
  username: string;
  revision: number;
  role: UserRole;
  fullName: FullNameDto;
  eventHistory: DomainEvent[];
}

export class User extends EventSourcedAggregateRoot {
  @Literal(USER_AGGREGATE_TYPE, {
    label: 'type',
    description: 'distinguishes users from other entities in our system',
  })
  readonly type = USER_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'unique system-identifier for this user',
  })
  id: string;

  @RawObject({
    label: 'event history',
    description: 'audit log containing all historical edits of this user',
    isArray: true,
    // should we force this to have at least one event?
    isOptional: true, // i.e. can be empty
  })
  eventHistory: DomainEvent[];

  @BooleanDataType({
    label: 'is active',
    description:
      'inactive users cannot access the system but are persisted for posterity',
  })
  isActive: boolean;

  @NonEmptyString({
    label: 'username',
    description: 'user readable unique system identifier for this user',
    mustBeUnique: true,
  })
  username: string;

  @NonEmptyString({
    label: 'email',
    description: `the user's email address`,
    mustBeUnique: true,
  })
  email: string;

  @BooleanDataType({
    label: 'has email been validated',
    description: 'has this user confirmed their email address?',
  })
  hasEmailBeenValidated = false;

  @NonNegativeInteger({
    label: 'revision',
    description: `tracks historical versions of this user's data`,
  })
  revision: number;

  @NestedDataType(() => FullName, {
    label: 'full name',
    description: `this user's full name`,
  })
  fullName: FullName;

  @EnumeratedType(userRoleValuesAndLabels, {
    label: 'role',
    description: `a user's role gives them course grained access to read or write data`,
  })
  role: UserRole;

  constructor({
    id,
    isActive,
    username,
    email,
    hasEmailBeenValidated,
    revision,
    fullName,
    role,
    eventHistory,
  }: {
    id: string;
    eventHistory: DomainEvent[];
    isActive: boolean;
    username: string;
    email: string;
    hasEmailBeenValidated?: boolean;
    revision: number;
    fullName: FullName;
    role: UserRole;
  }) {
    super();

    this.id = id;

    // just to be safe
    this.isActive = typeof isActive === 'boolean' ? isActive : false;

    this.username = username;

    this.email = email;

    this.revision = revision;

    this.fullName = fullName;

    this.role = role;

    this.eventHistory = eventHistory;

    if (typeof hasEmailBeenValidated === 'boolean') {
      this.hasEmailBeenValidated = hasEmailBeenValidated;
    }
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getName(): string {
    return this.fullName.toString();
  }

  toPersistenceDto(): UserPersistenceDto {
    return {
      id: this.id,
      isActive: this.isActive,
      username: this.username,
      email: this.email,
      hasEmailBeenValidated: this.hasEmailBeenValidated,
      revision: this.revision,
      role: this.role,
      fullName: this.fullName.toDto(),
      eventHistory: this.eventHistory,
    };
  }

  @UpdateMethod()
  grantUserRole(newRole: UserRole): User | TrueImpactError {
    if (this.role === newRole) {
      return new TrueImpactError(
        `You cannot grant the role: [${newRole}] to user: [${this.username}], as the user already has the given role.`,
      );
    }

    // TODO be sure there is a test case for when an invalid role is used

    return this.apply(
      new UserGrantedRole({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
          role: newRole,
        },
      }),
    );
  }

  handleUserGrantedRole({ payload: { role } }: UserGrantedRole) {
    this.role = role;

    return this;
  }

  @UpdateMethod()
  deactivate(): User | TrueImpactError {
    if (!this.isActive) {
      return new TrueImpactError(
        `You cannot deactivate user [${this.username}], as the user has already been deactivated.`,
      );
    }

    return this.apply(
      new UserDeactivated({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
        },
      }),
    );
  }

  handleUserDeactivated(_: UserDeactivated) {
    this.isActive = false;

    return this;
  }

  static fromUserWithPasswordCreated(event: UserWithPasswordCreated) {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
        username,
        // role,
        fullName,
        // TODO do this
        // email,
      },
    } = event;

    const instance = new User({
      id,
      username,
      role: DEFAULT_ROLE,
      isActive: false,
      email: 'TODO@todo.org',
      hasEmailBeenValidated: false,
      revision: 1,
      fullName: FullName.fromDto(fullName),
      eventHistory: [event],
    });

    instance.eventHistory.push(event);

    return instance.validateInvariants();
  }

  static fromEventHistory(
    eventHistory: Iterable<DomainEvent>,
  ): User | TrueImpactError | null {
    return EventSourcedAggregateRoot.fromEventHistory.call(
      User,
      eventHistory,
    ) as User;
  }

  static fromPersistenceDto(
    dto: UserPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): User | TrueImpactError {
    const {
      id,
      eventHistory,
      isActive,
      username,
      revision,
      role,
      fullName: fullNameDto,
      email,
      hasEmailBeenValidated,
    } = dto;

    const instance = new User({
      id,
      isActive,
      username,
      email,
      hasEmailBeenValidated,
      revision,
      role,
      fullName: FullName.fromDto(fullNameDto),
      eventHistory,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }

  static fromUserRequest(payload: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    // This is generated by the command handler, not the client
    id: string;
  }): User | TrueImpactError {
    const { id, username, email, firstName, lastName } = payload;

    const fullNameBuildResult = FullName.fromDto({
      firstName,
      middleNames: [],
      lastName,
    });

    // Where do we ensure that the first and last name are not omittied?
    if (fullNameBuildResult instanceof TrueImpactError) {
      return fullNameBuildResult;
    }

    const user = new User({
      id,
      // A new user will be active initially
      isActive: true,
      username,
      email,
      hasEmailBeenValidated: false,
      fullName: fullNameBuildResult,
      revision: 1,
      // You must run a command to escalate a user's priviliges
      role: 'employee',
      eventHistory: [
        new UserWithPasswordCreated({
          payload: {
            aggregateCompositeIdentifier: {
              type: USER_AGGREGATE_TYPE,
              id,
            },
            username,
            fullName: fullNameBuildResult.toDto(),
          },
        }),
      ],
    });

    return user.validateInvariants();
  }
}
