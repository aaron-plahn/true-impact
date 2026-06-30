import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from '../../constants';
import { GroupProgramCompositeIdentifier } from '../../group-program.composite-identifier';

class GroupProgramCreatedPayload {
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  @NonEmptyString({
    label: 'name',
    description: 'pubic-facing name for this program (and all of its sessions)',
  })
  name: string; // TODO ML text
}

@TrueImpactDataExample<GroupProgramCreated>({
  example: {
    type: 'GROUP_PROGRAM_CREATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: GROUP_PROGRAM_AGGREGATE_TYPE,
        id: '1',
      },
      name: `Hoopin' with Coach Aaron`,
    },
  },
})
export class GroupProgramCreated {
  readonly type = 'GROUP_PROGRAM_CREATED';

  readonly payload: GroupProgramCreatedPayload;

  constructor({ payload }: { payload: GroupProgramCreatedPayload }) {
    this.payload = payload;
  }
}
