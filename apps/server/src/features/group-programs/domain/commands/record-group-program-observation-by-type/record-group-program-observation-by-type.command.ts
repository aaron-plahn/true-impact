import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from '../../constants';
import {
  GroupProgramCompositeIdentifier,
  GroupProgramCompositeIdentifierValuedProperty,
} from '../../group-program.composite-identifier';

@TrueImpactDataExample<RecordGroupProgramObservationByType>({
  example: {
    aggregateCompositeIdentifier: {
      type: GROUP_PROGRAM_AGGREGATE_TYPE,
      id: '123',
    },
    interactionType: 'exclamation',
    sessionId: '1',
  },
})
export class RecordGroupProgramObservationByType {
  static readonly type = 'RECORD_GROUP_PROGRAM_OBSERVATION_BY_TYPE';

  @GroupProgramCompositeIdentifierValuedProperty
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  @NonEmptyString({
    label: 'session ID',
    description:
      'uniquely identifies the session at which the observation was made amongst other sessions of this group program',
  })
  sessionId: string;

  @NonEmptyString({
    label: 'interaction type',
    description: 'classifies the participant interaction',
  })
  interactionType: string;
}
