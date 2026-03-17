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
}

export class SurveyQuestionReviewRecord extends Entity<SurveyQuestionReviewRecordPersistenceDto> {
  // TODO change these to `Question` and `Option`?
  questionLabel: string;
  optionLabel: string;
  hasBeenViewed: boolean;
  // TODO `class Note` ?
  notes: MultilingualText[];

  constructor({
    questionLabel,
    optionLabel,
    hasBeenViewed,
    notes,
  }: {
    questionLabel: string;
    optionLabel: string;
    hasBeenViewed: boolean;
    notes?: MultilingualText[];
  }) {
    super();

    this.questionLabel = questionLabel;

    this.optionLabel = optionLabel;

    this.hasBeenViewed = hasBeenViewed;

    this.notes = notes || [];
  }

  validateComplexInvariants(): TrueImpactError[] {
    throw new Error('Method not implemented.');
  }

  getId(): string {
    throw new Error('Method not implemented.');
  }

  getName(): string {
    throw new Error('Method not implemented.');
  }

  toPersistenceDto(): SurveyQuestionReviewRecordPersistenceDto {
    throw new Error('Method not implemented.');
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
    });
  }
}
