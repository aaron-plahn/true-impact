import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from 'src/libs/data-types';
import {
  USER_AGGREGATE_TYPE,
  UserCompositeIdentifier,
  UserCompositeIdentifierValuedProp,
} from '../../user.composite-identifier';

export class UserDeactivatedPayload {
  @UserCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: UserCompositeIdentifier;
}

@TrueImpactDataExample<UserDeactivated>({
  example: {
    type: 'USER_DEACTIVATE',
    payload: {
      aggregateCompositeIdentifier: {
        type: USER_AGGREGATE_TYPE,
        id: '1234',
      },
    },
  },
})
export class UserDeactivated {
  readonly type = 'USER_DEACTIVATE';

  readonly payload: UserDeactivatedPayload;

  constructor({ payload }: { payload: UserDeactivatedPayload }) {
    this.payload = plainToInstance(UserDeactivatedPayload, payload);
  }

  static fromPersistenceDto(dto: UserDeactivated) {
    return new UserDeactivated(dto);
  }
}
