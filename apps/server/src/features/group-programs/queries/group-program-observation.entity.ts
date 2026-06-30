import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import {
  InvariantValidationError,
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../../libs/data-types';
import { NoteDto } from '../domain/commands';

class GroupProgramObservationPersistenceDto {
  interactionType?: string;

  note?: MultilingualTextPersistenceDto;
}

@TrueImpactDataExample<GroupProgramObservationPersistenceDto>({
  example: {},
})
export class GroupProgramObservation {
  @NonEmptyString({
    label: 'interaction type',
    description: 'a classification of this interaction',
    isOptional: true,
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
  classify(interactionType: string): GroupProgramObservation | TrueImpactError {
    if (this.interactionType) {
      throw new TrueImpactError(
        `You cannot classify intection as [${interactionType}], as it has already been classified as [${this.interactionType}]`,
      );
    }

    this.interactionType = interactionType;

    return this;
  }

  validateInvariants(): InvariantValidationError | GroupProgramObservation {
    if (!this.interactionType && !this.note) {
      return new InvariantValidationError(
        GroupProgramObservation,
        'group program observation',
        [
          new TrueImpactError(
            `Encountered an empty group program observation record. You must specify at least one of: [interaction type, note]`,
          ),
        ],
      );
    }

    return this;
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

  static fromPersistenceDto(
    dto: GroupProgramObservation,
    buildOptions: { shouldValidate?: boolean } = {},
  ): GroupProgramObservation | TrueImpactError {
    const instance = new GroupProgramObservation(dto);

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
