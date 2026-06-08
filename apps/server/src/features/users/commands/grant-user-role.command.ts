import { TrueImpactDataExample } from '../../../libs/data-types';
import { USER_AGGREGATE_TYPE } from '../constants';
import { UserRole } from '../types';
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

  aggregateCompositeIdentifier: UserCompositeIdentifier;

  // enum
  role: UserRole;
}
