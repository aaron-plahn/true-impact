import { GroupProgramCompositeIdentifier } from '../../group-program.composite-identifier';

// GroupSessionScheduled?
export class GroupProgramSessionScheduledPayload {
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  // TODO make this a proper date
  date: string;

  sessionId: string;
}

export class GroupProgramScheduled {
  readonly type = 'GROUP_PROGRAM_SESSION_SCHEDULED';

  readonly payload: GroupProgramSessionScheduledPayload;

  constructor({ payload }: { payload: GroupProgramSessionScheduledPayload }) {
    this.payload = payload;
  }
}
