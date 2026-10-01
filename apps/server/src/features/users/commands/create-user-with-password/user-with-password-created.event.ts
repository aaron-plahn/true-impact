import { plainToInstance } from 'class-transformer';
import { FullNameDto } from 'src/common/full-name';
import { NonEmptyString, TrueImpactDataExample } from 'src/libs/data-types';
import {
  USER_AGGREGATE_TYPE,
  UserCompositeIdentifier,
  UserCompositeIdentifierValuedProp,
} from '../../user.composite-identifier';

export class UserWithPasswordCreatedPayload {
  @UserCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: UserCompositeIdentifier;

  @NonEmptyString({
    label: 'username',
    description: `user chosen unique identifier used when logging in to the system`,
  })
  username: string;

  fullName: FullNameDto;

  @NonEmptyString({
    label: 'hashed password',
    description: `hashed (encrypted) copy of the user's password`,
  })
  hashedPassword: string;

  // algorithm?
}

@TrueImpactDataExample<UserWithPasswordCreated>({
  example: {
    type: 'USER_WITH_PASSWORD_CREATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: USER_AGGREGATE_TYPE,
        id: '444',
      },
      username: 'roboticardvark34',
      fullName: new FullNameDto(),
      hashedPassword: 'abc123eee999',
    },
  },
})
export class UserWithPasswordCreated {
  readonly type = 'USER_WITH_PASSWORD_CREATED';

  readonly payload: UserWithPasswordCreatedPayload;

  constructor({ payload }: { payload: UserWithPasswordCreatedPayload }) {
    this.payload = plainToInstance(UserWithPasswordCreatedPayload, payload);
  }

  static fromPersistenceDto(dto: UserWithPasswordCreated) {
    return new UserWithPasswordCreated(dto);
  }
}
