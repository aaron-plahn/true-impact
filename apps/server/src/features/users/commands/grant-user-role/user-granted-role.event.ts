import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from 'src/libs/data-types';
import { type UserRole, UserRoleEnumValuedProp } from '../../types';
import {
  USER_AGGREGATE_TYPE,
  UserCompositeIdentifier,
  UserCompositeIdentifierValuedProp,
} from '../../user.composite-identifier';

export class UserGrantedRolePayload {
  @UserCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: UserCompositeIdentifier;

  @UserRoleEnumValuedProp({
    label: 'role',
    description: 'the role that the user has been granted',
  })
  role: UserRole;
}

@TrueImpactDataExample<UserGrantedRole>({
  example: {
    type: 'USER_GRANTED_ROLE',
    payload: {
      aggregateCompositeIdentifier: {
        type: USER_AGGREGATE_TYPE,
        id: '55',
      },
      role: 'system admin',
    },
  },
})
export class UserGrantedRole {
  readonly type = 'USER_GRANTED_ROLE';

  readonly payload: UserGrantedRolePayload;

  constructor({ payload }: { payload: UserGrantedRolePayload }) {
    this.payload = plainToInstance(UserGrantedRolePayload, payload);
  }

  static fromPersistenceDto(dto: UserGrantedRole) {
    return new UserGrantedRole(dto);
  }
}
