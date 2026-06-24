import { NestedDataType, NonEmptyString } from '../../../../../libs/data-types';
import {
  GroupProgramCompositeIdentifier,
  GroupProgramCompositeIdentifierValuedProperty,
} from '../../group-program.composite-identifier';

export class NoteAboutGroupProgramClassifiedPayload {
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

export class NoteAboutGroupProgramClassified {
  readonly type = 'NOTE_ABOUT_GROUP_PROGRAM_CLASSIFIED';

  @NestedDataType(() => NoteAboutGroupProgramClassifiedPayload, {
    label: 'payload',
    description: 'event data',
  })
  readonly payload: NoteAboutGroupProgramClassifiedPayload;

  constructor({
    payload,
  }: {
    payload: NoteAboutGroupProgramClassifiedPayload;
  }) {
    this.payload = payload;
  }
}
