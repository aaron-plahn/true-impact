import { NestedDataType, NonEmptyString } from 'src/libs/data-types';
import {
  GroupProgramCompositeIdentifier,
  GroupProgramCompositeIdentifierValuedProperty,
} from '../../group-program.composite-identifier';

export class NoteDto {
  @NonEmptyString({
    label: 'text',
    description: 'text for this note',
  })
  text: string;

  @NonEmptyString({
    label: 'langauge',
    description: 'the language in which you are making a note',
  })
  languageCode?: string; // Language Code enum?
}

export class MakeNoteAboutGroupProgramObservation {
  @GroupProgramCompositeIdentifierValuedProperty
  aggregateCompositeIdentifier: GroupProgramCompositeIdentifier;

  @NonEmptyString({
    label: 'session ID',
    description:
      'uniquely identifies the session at which the observation was made amongst other sessions of this group program',
  })
  sessionId: string;

  @NestedDataType(() => NoteDto, {
    label: 'note',
    description: `textual note about a participant's response to the group activity`,
  })
  note: NoteDto;
}
