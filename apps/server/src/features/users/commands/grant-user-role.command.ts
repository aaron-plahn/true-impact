import { TrueImpactDataExample } from '../../../libs/data-types';
import { TI_SYSTEM_USER_AGGREGATE_TYPE } from '../constants';
import { TiSystemUserCompositeIdentifier } from '../ti-system-user.composite-identifier';
import { TiUserRole } from '../types';

@TrueImpactDataExample<GrantUserRole>({
  example: {
    aggregateCompositeIdentifier: {
      type: TI_SYSTEM_USER_AGGREGATE_TYPE,
      id: '1',
    },
    role: 'employee',
  },
})
export class GrantUserRole {
  static type = 'GRANT_USER_ROLE';

  aggregateCompositeIdentifier: TiSystemUserCompositeIdentifier;

  // enum
  role: TiUserRole;
}
