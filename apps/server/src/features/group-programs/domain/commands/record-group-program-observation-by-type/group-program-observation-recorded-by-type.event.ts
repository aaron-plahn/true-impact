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

export class GroupProgramObservationRecordedByTypePayload {
  @GroupProgramCompositeIdentifierValuedProperty
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  @NonEmptyString({
    label: 'session ID',
    description:
      'uniquely identifies the session at which the observation was made amongst other sessions of this group program',
    isOptional: true,
  })
  // TODO should this be optional?
  sessionId?: string;

  @NonEmptyString({
    label: 'interaction type',
    description: 'classifies the participant interaction',
  })
  interactionType: string;
}

@TrueImpactDataExample<GroupProgramObservationRecordedByType>({
  example: {
    type: 'GROUP_PROGRAM_OBSERVATION_RECORDED_BY_TYPE',
    payload: {
      aggregateCompositeIdentifier: {
        type: GROUP_PROGRAM_AGGREGATE_TYPE,
        id: '5',
      },
      interactionType: 'evil laugh',
    },
  },
})
export class GroupProgramObservationRecordedByType {
  readonly type = 'GROUP_PROGRAM_OBSERVATION_RECORDED_BY_TYPE';

  @NestedDataType(() => GroupProgramObservationRecordedByTypePayload, {
    label: 'payload',
    description: 'event data',
  })
  payload: GroupProgramObservationRecordedByTypePayload;

  constructor({
    payload,
  }: {
    payload: GroupProgramObservationRecordedByTypePayload;
  }) {
    this.payload = payload;
  }
}
