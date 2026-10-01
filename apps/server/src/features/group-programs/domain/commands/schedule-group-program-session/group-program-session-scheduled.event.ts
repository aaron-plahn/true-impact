import { plainToInstance } from 'class-transformer';
import {
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from '../../constants';
import {
  GroupProgramCompositeIdentifier,
  GroupProgramCompositeIdentifierValuedProperty,
} from '../../group-program.composite-identifier';
import { GroupSessionLocationDto } from '../../group-session-location.value-object';

export class GroupProgramSessionScheduledPayload {
  @GroupProgramCompositeIdentifierValuedProperty
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  @NonEmptyString({
    label: 'date',
    description: 'calendar date on which this session wil occur',
  })
  // TODO consider how we persist time stamps \ dates
  // TODO start time \ end time?
  date: string;

  @NonEmptyString({
    label: 'session ID',
    description:
      'uniquely identifies this session amongst others for the same group program',
  })
  sessionId: string;

  @NestedDataType(() => GroupSessionLocationDto, {
    label: 'location',
    description: `details about the physical location where this session will take place`,
  })
  location: GroupSessionLocationDto;
}

@TrueImpactDataExample<GroupProgramSessionScheduled>({
  example: {
    type: 'GROUP_PROGRAM_SESSION_SCHEDULED',
    payload: {
      aggregateCompositeIdentifier: {
        type: GROUP_PROGRAM_AGGREGATE_TYPE,
        id: '555',
      },
      date: '12-12-2013',
      sessionId: '5',
      location: {},
    },
  },
})
export class GroupProgramSessionScheduled {
  readonly type = 'GROUP_PROGRAM_SESSION_SCHEDULED';

  readonly payload: GroupProgramSessionScheduledPayload;

  constructor({ payload }: { payload: GroupProgramSessionScheduledPayload }) {
    this.payload = plainToInstance(
      GroupProgramSessionScheduledPayload,
      payload,
    );
  }

  static fromPersistenceDto(dto: GroupProgramSessionScheduled) {
    return new GroupProgramSessionScheduled(dto);
  }
}
