import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import { Entity, TrueImpactError } from '../../../libs/data-types';

export class SurveyQuestionReviewRecordPersistenceDto {
  questionLabel: string;
  hasBeenViewed: boolean;
  notes: MultilingualTextPersistenceDto[];
}

export class SurveyQuestionReviewRecord extends Entity<SurveyQuestionReviewRecordPersistenceDto> {
  questionLabel: string;
  hasBeenViewed: boolean;
  // todo `class Note` ?
  notes: MultilingualText[];

  constructor({
    questionLabel,
    hasBeenViewed,
    notes,
  }: {
    questionLabel: string;
    hasBeenViewed: boolean;
    notes?: MultilingualText[];
  }) {
    super();

    this.questionLabel = questionLabel;

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

  static fromPersistenceDto(
    {
      questionLabel,
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
      hasBeenViewed,
      notes: notes as MultilingualText[],
    });
  }
}
