import { NotImplementedException } from '@nestjs/common';
import { MultilingualText } from 'src/common/multilingual-text';
import {
  NestedDataType,
  NonEmptyString,
  TrueImpactError,
} from 'src/libs/data-types';
import { NoteDto } from '../domain/commands';

export class GroupProgramObservation {
  @NonEmptyString({
    label: 'interaction type',
    description: 'a classification of this interaction',
  })
  interactionType?: string;

  @NestedDataType(() => MultilingualText, {
    label: 'note',
    description: 'note about the interaction',
    isOptional: true,
  })
  note?: MultilingualText;

  constructor({
    interactionType,
    note,
  }: {
    interactionType?: string;
    note?: MultilingualText;
  }) {
    this.note = note;

    this.interactionType = interactionType;
  }

  /**
   * When one has recorded an observation by making a note, this interaction can later
   * be classified using an `interaction type`.
   */
  classify(
    _interactionType: string,
  ): GroupProgramObservation | TrueImpactError {
    // if(this.interactionType){
    //     // TODO validate that ther eis not already an observation
    // }

    throw new NotImplementedException();
  }

  static fromUserNote(note: NoteDto): GroupProgramObservation {
    return new GroupProgramObservation({
      note: MultilingualText.withText({
        text: note.text,
        languageCode: note.languageCode,
      }) as MultilingualText, // todo validate invariants
    });
  }

  /**
   * This models the case where the list of standard interaction types
   * is appropriate to the observation. It facilitates rapid observations.
   */
  static fromDirectClassification(interactionType: string) {
    return new GroupProgramObservation({
      interactionType,
    });
  }
}
