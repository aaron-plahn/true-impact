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

@TrueImpactDataExample<NoteAboutGroupProgramClassified>({
  example: {
    type: 'NOTE_ABOUT_GROUP_PROGRAM_CLASSIFIED',
    payload: {
      aggregateCompositeIdentifier: {
        type: GROUP_PROGRAM_AGGREGATE_TYPE,
        id: '565',
      },
      observationId: '1',
      interactionType: 'befuddlement',
    },
  },
})
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
