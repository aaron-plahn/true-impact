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

@TrueImpactDataExample<NoteAboutGroupProgramObservationMade>({
  example: {
    type: 'NOTE_ABOUT_GROUP_PROGRAM_OBSERVATION_MADE',
    payload: {
      aggregateCompositeIdentifier: {
        type: GROUP_PROGRAM_AGGREGATE_TYPE,
        id: '43',
      },
      sessionId: '1',
      note: {
        text: `One kid screamed, "would you look at that?"`,
        languageCode: 'en',
      },
    },
  },
})
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
