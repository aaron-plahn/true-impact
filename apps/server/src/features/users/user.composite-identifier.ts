import { Literal, NestedDataType, NonEmptyString } from '../../libs/data-types';

export const USER_AGGREGATE_TYPE = 'system user';

export const UserCompositeIdentifierValuedProp = NestedDataType(
  () => UserCompositeIdentifier,
  {
    label: 'composite ID',
    description: 'system-wide unique identifier to this user',
  },
);

export class UserCompositeIdentifier {
  @Literal(USER_AGGREGATE_TYPE, {
    label: 'user',
    description: 'user',
  })
  type = USER_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'system identifier for this user',
  })
  id: string;
}
