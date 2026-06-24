import { NestedDataType, NonEmptyString } from 'src/libs/data-types';
import {
  GroupProgramCompositeIdentifier,
  GroupProgramCompositeIdentifierValuedProperty,
} from '../../group-program.composite-identifier';
import { NoteDto } from './make-note-about-group-program-observation.command';

export class NoteAboutGroupProgramObservationMadePayload {
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
    description: 'text for the note',
  })
  note: NoteDto;
}

export class NoteAboutGroupProgramObservationMade {
  readonly type = 'NOTE_ABOUT_GROUP_PROGRAM_OBSERVATION_MADE';

  @NestedDataType(() => NoteAboutGroupProgramObservationMadePayload, {
    label: 'payload',
    description: 'event data',
  })
  readonly payload: NoteAboutGroupProgramObservationMadePayload;

  constructor({
    payload,
  }: {
    payload: NoteAboutGroupProgramObservationMadePayload;
  }) {
    this.payload = payload;
  }
}
