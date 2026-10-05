import { plainToInstance } from 'class-transformer';
import { FullNameDto } from 'src/common/full-name';
import { NestedDataType, NonEmptyString } from 'src/libs/data-types';
import {
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

  @NestedDataType(() => FullNameDto, {
    label: 'full name',
    description: `the user's full name`,
  })
  fullName: FullNameDto;
}

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
