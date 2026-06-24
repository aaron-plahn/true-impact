import { NonEmptyString } from '../../../../../libs/data-types';
import {
  GroupProgramCompositeIdentifier,
  GroupProgramCompositeIdentifierValuedProperty,
} from '../../group-program.composite-identifier';

export class ClassifyNoteAboutGroupProgramObservation {
  static readonly type = 'CLASSIFY_NOTE_ABOUT_GROUP_PROGRAM_OBSERVATION';

  @GroupProgramCompositeIdentifierValuedProperty
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  @NonEmptyString({
    label: 'observation ID',
    description:
      'uniquely identifies the observation that is the subject of this note amongst other observations of this group program',
  })
  observationId: string;

  @NonEmptyString({
    label: 'interaction type',
    description: 'classifies this interaction',
  })
  interactionType: string;
}
