import { TrueImpactDataExample } from '../../../libs/data-types';
import { TI_SYSTEM_USER_AGGREGATE_TYPE } from '../constants';
import { TiSystemUserCompositeIdentifier } from '../ti-system-user.composite-identifier';

@TrueImpactDataExample<DeactivateTiSystemUser>({
  example: {
    aggregateCompositeIdentifier: {
      type: TI_SYSTEM_USER_AGGREGATE_TYPE,
      id: '1',
    },
  },
})
export class DeactivateTiSystemUser {
  static readonly type = 'DEACTIVATE_USER';

  aggregateCompositeIdentifier: TiSystemUserCompositeIdentifier;
}
