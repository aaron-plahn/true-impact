import { TrueImpactDataExample } from '../../../libs/data-types';
import { USER_AGGREGATE_TYPE } from '../constants';
import { UserCompositeIdentifier } from '../user.composite-identifier';

@TrueImpactDataExample<DeactivateUser>({
  example: {
    aggregateCompositeIdentifier: {
      type: USER_AGGREGATE_TYPE,
      id: '1',
    },
  },
})
export class DeactivateUser {
  static readonly type = 'DEACTIVATE_USER';

  aggregateCompositeIdentifier: UserCompositeIdentifier;
}
