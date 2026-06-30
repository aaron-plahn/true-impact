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

@TrueImpactDataExample<MakeNoteAboutGroupProgramObservation>({
  example: {
    aggregateCompositeIdentifier: {
      id: '1',
      type: GROUP_PROGRAM_AGGREGATE_TYPE,
    },
    sessionId: '1',
    note: {
      text: 'This one kid screamed "Whoa! Rarrr!"',
    },
  },
})
export class MakeNoteAboutGroupProgramObservation {
  static readonly type = 'MAKE_NOTE_ABOUT_GROUP_PROGRAM_OBSERVATION';

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
