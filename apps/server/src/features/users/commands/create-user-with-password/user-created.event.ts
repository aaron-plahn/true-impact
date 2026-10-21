import { plainToInstance } from 'class-transformer';
import { FullNameDto } from '../../../../common/full-name';
import {
  EmailAddress,
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  USER_AGGREGATE_TYPE,
  UserCompositeIdentifier,
  UserCompositeIdentifierValuedProp,
} from '../../user.composite-identifier';

export class UserCreatedPayload {
  @UserCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: UserCompositeIdentifier;

  @NonEmptyString({
    label: 'username',
    description: `user chosen unique identifier used when logging in to the system`,
  })
  username: string;

  @EmailAddress({
    label: 'email',
    description:
      'the primary email address used for system communication with this user (does not serve as a unique identifier and can be changed)',
  })
  // Can we use a `branded type` here?
  email: string;

  @NestedDataType(() => FullNameDto, {
    label: 'full name',
    description: `the new user's full name`,
  })
  fullName: FullNameDto;
}

@TrueImpactDataExample<UserCreated>({
  example: {
    type: 'USER_CREATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: USER_AGGREGATE_TYPE,
        id: '444',
      },
      username: 'roboticardvark34',
      email: 'roboticardvark@mytotallybogusacmedomain.com',
      fullName: new FullNameDto(),
    },
  },
})
export class UserCreated {
  readonly type = 'USER_CREATED';

  readonly payload: UserCreatedPayload;

  constructor({ payload }: { payload: UserCreatedPayload }) {
    this.payload = plainToInstance(UserCreatedPayload, payload);
  }

  static fromPersistenceDto(dto: UserCreated) {
    return new UserCreated(dto);
  }
}
