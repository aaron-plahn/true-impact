import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { USER_AGGREGATE_TYPE } from '../constants';
import type { UserRole } from '../types';
import { UserCompositeIdentifier } from '../user.composite-identifier';

@TrueImpactDataExample<GrantUserRole>({
  example: {
    aggregateCompositeIdentifier: {
      type: USER_AGGREGATE_TYPE,
      id: '1',
    },
    role: 'employee',
  },
})
export class GrantUserRole {
  static type = 'GRANT_USER_ROLE';

  @NestedDataType(() => UserCompositeIdentifier, {
    label: 'composite ID',
    description: 'system-wide unique reference to this user',
  })
  aggregateCompositeIdentifier: UserCompositeIdentifier;

  // enum
  // TODO @Enum?
  @NonEmptyString({
    label: 'role',
    description: `a role gives course-grained access to permissions to read and write data`,
  })
  role: UserRole;
}
