import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import { Entity, TrueImpactError } from '../../../libs/data-types';

export class SurveyQuestionReviewRecordPersistenceDto {
  questionLabel: string;
  optionLabel: string;
  hasBeenViewed: boolean;
  notes: MultilingualTextPersistenceDto[];
  flagIds: string[];
}

export class SurveyQuestionReviewRecord extends Entity<SurveyQuestionReviewRecordPersistenceDto> {
  label: string;
  chosenOptionLabel: string;
  hasBeenViewed: boolean;
  // TODO `class Note` ?
  notes: MultilingualText[];
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

    this.notes = notes || [];

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
