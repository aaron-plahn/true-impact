import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from '../../constants';
import {
  GroupProgramCompositeIdentifier,
  GroupProgramCompositeIdentifierValuedProperty,
} from '../../group-program.composite-identifier';

@TrueImpactDataExample<ClassifyNoteAboutGroupProgramObservation>({
  example: {
    aggregateCompositeIdentifier: {
      id: '1',
      type: GROUP_PROGRAM_AGGREGATE_TYPE,
    },
    sessionId: '2',
    observationId: '1',
    interactionType: 'positive exclamation',
  },
})
export class ClassifyNoteAboutGroupProgramObservation {
  static readonly type = 'CLASSIFY_NOTE_ABOUT_GROUP_PROGRAM_OBSERVATION';

  @GroupProgramCompositeIdentifierValuedProperty
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  @NonEmptyString({
    label: 'session ID',
    description: 'the session under observation',
  })
  sessionId: string;

  @NonEmptyString({
    label: 'observation ID',
    description: 'the existing observation (note) that you are classifying',
  })
  observationId: string;

  @NonEmptyString({
    label: 'interaction type',
    description: 'classifies this interaction',
  })
  interactionType: string;
}
