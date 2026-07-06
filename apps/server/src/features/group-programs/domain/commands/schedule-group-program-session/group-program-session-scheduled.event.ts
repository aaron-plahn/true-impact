import { TrueImpactDataExample } from '../../../../../libs/data-types';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from '../../constants';
import { GroupProgramCompositeIdentifier } from '../../group-program.composite-identifier';

// GroupSessionScheduled?
export class GroupProgramSessionScheduledPayload {
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  // TODO make this a proper date
  date: string;

  sessionId: string;
}

@TrueImpactDataExample<GroupProgramScheduled>({
  example: {
    type: 'GROUP_PROGRAM_SESSION_SCHEDULED',
    payload: {
      aggregateCompositeIdentifier: {
        type: GROUP_PROGRAM_AGGREGATE_TYPE,
        id: '555',
      },
      date: '12-12-2013',
      sessionId: '5',
    },
  },
})
export class GroupProgramScheduled {
  readonly type = 'GROUP_PROGRAM_SESSION_SCHEDULED';

  readonly payload: GroupProgramSessionScheduledPayload;

  constructor({ payload }: { payload: GroupProgramSessionScheduledPayload }) {
    this.payload = payload;
  }
}
