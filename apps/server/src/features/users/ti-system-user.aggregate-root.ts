import { FullName, FullNameDto } from '../../common/full-name';
import {
  AggregateRoot,
  BooleanDataType,
  Entity,
  NonEmptyString,
  TrueImpactError,
  UpdateMethod,
} from '../../libs/data-types';
import { TI_SYSTEM_USER_AGGREGATE_TYPE } from './constants';
import type { TiUserRole } from './types';

export class TiSystemUserPersistenceDto {
  id: string;
  hashedPassword: string;
  isActive: boolean;
  email: string;
  hasEmailBeenValidated: boolean;
  username: string;
  revision: number;
  role: TiUserRole;
  fullName: FullNameDto;
}

export class TiSystemUser extends AggregateRoot<TiSystemUserPersistenceDto> {
  static readonly type = TI_SYSTEM_USER_AGGREGATE_TYPE;

  id: string;

  @NonEmptyString({
    label: 'hashed password',
    description: 'encrypted password for authentication purposes',
  })
  hashedPassword: string;

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

  revision: number;

  fullName: FullName;

  // TODO enum?
  role: TiUserRole;

  constructor({
    id,
    hashedPassword,
    isActive,
    username,
    email,
    hasEmailBeenValidated,
    revision,
    fullName,
    role,
  }: {
    id: string;
    hashedPassword: string;
    isActive: boolean;
    username: string;
    email: string;
    hasEmailBeenValidated?: boolean;
    revision: number;
    fullName: FullName;
    role: TiUserRole;
  }) {
    super();

    this.id = id;

    this.hashedPassword = hashedPassword;

    // just to be safe
    this.isActive = typeof isActive === 'boolean' ? isActive : false;

    this.username = username;

    this.email = email;

    this.revision = revision;

    this.fullName = fullName;

    this.role = role;

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

  toPersistenceDto(): TiSystemUserPersistenceDto {
    return {
      id: this.id,
      hashedPassword: this.hashedPassword,
      isActive: this.isActive,
      username: this.username,
      email: this.email,
      hasEmailBeenValidated: this.hasEmailBeenValidated,
      revision: this.revision,
      role: this.role,
      fullName: this.fullName.toDto(),
    };
  }

  @UpdateMethod()
  grantUserRole(newRole: TiUserRole): TiSystemUser | TrueImpactError {
    if (this.role === newRole) {
      return new TrueImpactError(
        `You cannot grant the role: [${newRole}] to user: [${this.username}], as the user already has the given role.`,
      );
    }

    this.role = newRole;

    return this;
  }

  @UpdateMethod()
  deactivate(): TiSystemUser | TrueImpactError {
    if (!this.isActive) {
      return new TrueImpactError(
        `You cannot deactivate user [${this.username}], as the user has already been deactivated.`,
      );
    }

    this.isActive = false;

    return this;
  }

  static fromPersistenceDto(
    dto: TiSystemUserPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): Entity | TrueImpactError {
    const {
      id,
      hashedPassword,
      isActive,
      username,
      revision,
      role,
      fullName: fullNameDto,
      email,
      hasEmailBeenValidated,
    } = dto;

    const instance = new TiSystemUser({
      id,
      hashedPassword,
      isActive,
      username,
      email,
      hasEmailBeenValidated,
      revision,
      role,
      fullName: FullName.fromDto(fullNameDto),
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }

  static fromUserRequest(payload: {
    username: string;
    // the command handler must encrypt this before building the initial user instance
    hashedPassword: string;
    email: string;
    firstName: string;
    lastName: string;
  }): TiSystemUser | TrueImpactError {
    const { hashedPassword, username, email, firstName, lastName } = payload;

    const fullNameBuildResult = FullName.fromDto({
      firstName,
      middleNames: [],
      lastName,
    });

    // Where do we ensure that the first and last name are not omittied?
    if (fullNameBuildResult instanceof TrueImpactError) {
      return fullNameBuildResult;
    }

    const user = new TiSystemUser({
      id: 'GENERATE_A_NEW_ID',
      hashedPassword,
      // A new user will be active initially
      isActive: true,
      username,
      email,
      hasEmailBeenValidated: false,
      fullName: fullNameBuildResult,
      revision: 1,
      // You must run a command to escalate a user's priviliges
      role: 'employee',
    });

    return user.validateInvariants();
  }
}
