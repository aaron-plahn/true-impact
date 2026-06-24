import {
  NestedDataType,
  TrueImpactDataExample,
} from '../../../libs/data-types';
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

  @NestedDataType(() => UserCompositeIdentifier, {
    label: 'composite ID',
    description: 'a system-wide unique identifier for the user to deactivate',
  })
  aggregateCompositeIdentifier: UserCompositeIdentifier;
}
