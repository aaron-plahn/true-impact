import { MultilingualText } from '../../../common/multilingual-text';
import {
  Entity,
  NestedDataType,
  TrueImpactError,
} from '../../../libs/data-types';
import {
  SurveyQuestionReviewRecord,
  SurveyQuestionReviewRecordPersistenceDto,
} from './survey-question-review-record.entity';

type QuestionLabel = string;

class SurveyReviewPersistenceDto {
  questionsReviewed: Record<
    QuestionLabel,
    SurveyQuestionReviewRecordPersistenceDto
  >;
}

export class SurveyReview extends Entity<SurveyReviewPersistenceDto> {
  // @lookup table
  questionsReviewed: Map<QuestionLabel, SurveyQuestionReviewRecord>;

  @NestedDataType(() => MultilingualText, {
    label: 'notes',
    description: `A list of general notes about this participant's response to this survey in general.`,
  })
  notes: MultilingualText[] = [];

  constructor({
    questionsReviewed,
  }: {
    questionsReviewed: Map<QuestionLabel, SurveyQuestionReviewRecord>;
  }) {
    super();

    this.questionsReviewed = questionsReviewed;
  }

  toPersistenceDto(): SurveyReviewPersistenceDto {
    const questionsReviewed: Record<
      QuestionLabel,
      SurveyQuestionReviewRecordPersistenceDto
    > = {};

    this.questionsReviewed.forEach((reviewRecordForQuestion, questionLabel) => {
      questionsReviewed[questionLabel] =
        reviewRecordForQuestion.toPersistenceDto();
    });

    return {
      questionsReviewed,
    };
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

  static fromPersistenceDto(
    dto: SurveyReviewPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): Entity | TrueImpactError {
    const questionsReviewed = new Map<
      QuestionLabel,
      SurveyQuestionReviewRecord
    >();

    const questionReviewBuildErrors: TrueImpactError[] = [];

    Object.entries(dto).forEach(
      ([questionLabel, questionReviewDto]: [
        string,
        SurveyQuestionReviewRecordPersistenceDto,
      ]) => {
        const buildResult = SurveyQuestionReviewRecord.fromPersistenceDto(
          questionReviewDto,
          buildOptions,
        );

        if (buildResult instanceof TrueImpactError) {
          questionReviewBuildErrors.push(buildResult);

          return;
        }

        questionsReviewed.set(questionLabel, buildResult);
      },
    );

    return new SurveyReview({
      questionsReviewed,
    });
  }
}
