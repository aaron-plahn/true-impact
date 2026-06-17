import { NonEmptyString } from 'src/libs/data-types';
import { GroupProgramCompositeIdentifier } from '../../group-program.composite-identifier';

class GroupProgramCreatedPayload {
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  @NonEmptyString({
    label: 'name',
    description: 'pubic-facing name for this program (and all of its sessions)',
  })
  name: string; // TODO ML text
}

export class GroupProgramCreated {
  readonly type = 'GROUP_PROGRAM_CREATED';

  readonly payload: GroupProgramCreatedPayload;

  constructor({ payload }: { payload: GroupProgramCreatedPayload }) {
    this.payload = payload;
  }
}
