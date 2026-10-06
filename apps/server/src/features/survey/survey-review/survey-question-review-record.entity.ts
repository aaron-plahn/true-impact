import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import {
  BooleanDataType,
  Entity,
  NestedDataType,
  NonEmptyString,
  TrueImpactError,
} from '../../../libs/data-types';
import { SetDataType } from '../../../libs/data-types/schema-management/decorators/set-data-type.decorator';

export class SurveyQuestionReviewRecordPersistenceDto {
  questionLabel: string;
  optionLabel: string;
  hasBeenViewed: boolean;
  notes: MultilingualTextPersistenceDto[];
  flagIds: string[];
}

export class SurveyQuestionReviewRecord extends Entity<SurveyQuestionReviewRecordPersistenceDto> {
  @NonEmptyString({
    label: 'label',
    description: 'identifier for the question whose response is recorded here',
  })
  label: string;

  @NonEmptyString({
    label: 'label',
    description:
      'identifies the option the participant chose for this question',
  })
  chosenOptionLabel: string;

  @BooleanDataType({
    label: 'has been viewed',
    description: `Has a reviewer has acknowledged that this question has been reviewed?`,
  })
  hasBeenViewed: boolean;

  // TODO `class Note` ?
  @NestedDataType(() => MultilingualText, {
    label: 'notees',
    description: `notes about the client's response to this particular question`,
    isArray: true,
    isOptional: true,
  })
  notes: MultilingualText[] = [];

  @SetDataType('string', {
    label: 'flag IDs',
    description: `a set of references to the flags that the reviewer has raised due to the participant's response to this question`,
  })
  flagIds = new Set<string>();

  constructor({
    questionLabel,
    optionLabel,
    hasBeenViewed,
    notes,
    flagIds,
  }: {
    questionLabel: string;
    optionLabel: string;
    hasBeenViewed: boolean;
    notes?: MultilingualText[];
    flagIds?: Set<string>;
  }) {
    super();

    this.label = questionLabel;

    this.chosenOptionLabel = optionLabel;

    this.hasBeenViewed = hasBeenViewed;

    if (Array.isArray(notes)) {
      this.notes = notes;
    } else {
      this.notes = [];
    }

    if (flagIds) {
      flagIds.forEach((flagId) => {
        this.flagIds.add(flagId);
      });
    }
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.label;
  }

  getName(): string {
    return `${this.label} - review record`;
  }

  toPersistenceDto(): SurveyQuestionReviewRecordPersistenceDto {
    return {
      questionLabel: this.label,
      optionLabel: this.chosenOptionLabel,
      hasBeenViewed: this.hasBeenViewed,
      notes: this.notes.map((n) => n.toPersistenceDto()),
      flagIds: [...this.flagIds],
    };
  }

  static buildEmptyFromResponse({
    questionLabel,
    optionLabel,
  }: {
    questionLabel: string;
    optionLabel: string;
  }): SurveyQuestionReviewRecord {
    return new SurveyQuestionReviewRecord({
      questionLabel,
      optionLabel,
      hasBeenViewed: false,
      notes: [],
    });
  }

  static fromPersistenceDto(
    {
      questionLabel,
      optionLabel,
      hasBeenViewed,
      notes: notesDtos,
      flagIds,
    }: SurveyQuestionReviewRecordPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): SurveyQuestionReviewRecord | TrueImpactError {
    const notes = notesDtos.map((dto) =>
      MultilingualText.fromPersistenceDto(dto, buildOptions),
    );

    const noteErrors = notes.filter((n) => n instanceof TrueImpactError);

    if (noteErrors.length > 0) {
      return new TrueImpactError(
        `Failed to build a survey question review record for question [${questionLabel}].`,
        noteErrors,
      );
    }

    return new SurveyQuestionReviewRecord({
      questionLabel,
      optionLabel,
      hasBeenViewed,
      notes: notes as MultilingualText[],
      flagIds: new Set(flagIds),
    });
  }
}
