import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import {
  AggregateRoot,
  Entity,
  NestedDataType,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';
import { SurveyResponseRecord } from '../survey-completion';
import { SurveyParticipantCompositeIdentifier } from '../survey-completion/models';
import { SURVEY_REVIEW_AGGREGATE_TYPE } from './constants';
import {
  SurveyQuestionReviewRecord,
  SurveyQuestionReviewRecordPersistenceDto,
} from './survey-question-review-record.entity';

class SurveyReviewPersistenceDto {
  id: string;
  revision: number;
  hasBeenSubmitted: boolean;
  questionsReviewed: SurveyQuestionReviewRecordPersistenceDto[];
  surveyName: string;
  surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
  generalNotes: MultilingualTextPersistenceDto[];
}

export class SurveyReview extends AggregateRoot<SurveyReviewPersistenceDto> {
  static readonly type = SURVEY_REVIEW_AGGREGATE_TYPE;

  id: string;

  revision: number;

  hasBeenSubmitted: boolean;

  surveyName: string;

  surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;

  // @lookup table
  questionsReviewed: SurveyQuestionReviewRecord[];

  @NestedDataType(() => MultilingualText, {
    label: 'notes',
    description: `A list of general notes about this participant's response to this survey in general.`,
  })
  generalNotes: MultilingualText[] = [];

  constructor({
    id,
    revision,
    hasBeenSubmitted,
    questionsReviewed,
    surveyName,
    surveyParticipantCompositeIdentifier,
    generalNotes,
  }: {
    id: string;
    revision: number;
    hasBeenSubmitted: boolean;
    questionsReviewed: SurveyQuestionReviewRecord[];
    surveyName: string;
    surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
    generalNotes?: MultilingualText[];
  }) {
    super();

    this.id = id;

    this.revision = revision;

    this.questionsReviewed = questionsReviewed;

    this.surveyName = surveyName;

    this.surveyParticipantCompositeIdentifier =
      surveyParticipantCompositeIdentifier;

    if (Array.isArray(generalNotes)) {
      this.generalNotes = generalNotes;
    }

    this.hasBeenSubmitted = hasBeenSubmitted;
  }

  @UpdateMethod()
  acknowledgeResponseToQuestionViewed(
    questionLabel: string,
  ): SurveyReview | TrueImpactError {
    const questionSearchResult =
      this.questionsReviewed.find((q) => q.label === questionLabel) ||
      new TrueImpactError(
        `You cannot acknowledge review of question [${questionLabel}] in attempt [${this.id}] of survey [${this.surveyName}], as there is no such question.`,
      );

    if (questionSearchResult instanceof TrueImpactError) {
      return questionSearchResult;
    }

    if (questionSearchResult.hasBeenViewed) {
      return new TrueImpactError(
        // TODO let's make our wording of this action consistent across the board
        `You cannot acknowledge review of question [${questionLabel}] in attempt [${this.id}] of survey [${this.surveyName}], as it has already been marked as viewed.`,
      );
    }

    // Note that this is modified as an original array element by reference (a side-effect)
    questionSearchResult.hasBeenViewed = true;

    return this.applyUpdateIfPossible(
      `mark question [${questionLabel}] as viewed`,
    );
  }

  @UpdateMethod()
  addNoteAboutResponseToQuestion({
    questionLabel,
    text,
    languageCode,
  }: {
    questionLabel: string;
    text: string;
    languageCode: string;
  }): SurveyReview | TrueImpactError {
    const targetQuestion =
      this.questionsReviewed.find((q) => q.label === questionLabel) ||
      new TrueImpactError(
        `You cannot add a note about the participant's response to question [${questionLabel}] in attempt [${this.id}] of survey [${this.surveyName}], as there is no such question.`,
      );

    if (targetQuestion instanceof TrueImpactError) {
      return targetQuestion;
    }

    const textBuildResult = MultilingualText.withText({ text, languageCode });

    if (textBuildResult instanceof TrueImpactError) {
      return new TrueImpactError(
        `Failed to add note about question [${questionLabel}] in attempt [${this.id}] of survey [${this.surveyName}]. Invalid multilingual text provided.`,
        [textBuildResult],
      );
    }

    targetQuestion.notes.push(textBuildResult);

    /**
     * We automatically mark the question as viewed once a note has been made.
     * We need to gather user feedback on this once the UX is complete.
     */
    targetQuestion.hasBeenViewed = true;

    return this.applyUpdateIfPossible(
      `add a note about question [${questionLabel}]`,
    );
  }

  @UpdateMethod()
  addGeneralNote({
    text,
    languageCode,
  }: {
    text: string;
    languageCode: string;
  }) {
    const multilingualTextBuildResult = MultilingualText.withText({
      text,
      languageCode,
    });

    if (multilingualTextBuildResult instanceof TrueImpactError) {
      return new TrueImpactError(
        `Failed to add a general note about attempt [${this.id}] of survey [${this.surveyName}]. Invalid text was provided.`,
        [multilingualTextBuildResult],
      );
    }

    this.generalNotes.push(multilingualTextBuildResult);

    return this.applyUpdateIfPossible(
      `add a general note about this client's survey response`,
    );
  }

  @UpdateMethod()
  flagResponseToQuestion({
    questionLabel,
    flagId,
  }: {
    questionLabel: string;
    flagId: string;
  }): SurveyReview | TrueImpactError {
    const targetQuestion =
      this.questionsReviewed.find((q) => q.label === questionLabel) ||
      new TrueImpactError(
        `You cannot flag question [${questionLabel}] in attempt [${this.id}] of survey [${this.surveyName}] with flag [${flagId}], as there is no such question`,
      );

    if (targetQuestion instanceof TrueImpactError) {
      return targetQuestion;
    }

    if (targetQuestion.flagIds.has(flagId)) {
      return new TrueImpactError(
        `You cannot flag question [${questionLabel}] in attempt [${this.id}] of survey [${this.surveyName}] with flag [${flagId}], as it already has this flag.`,
      );
    }

    targetQuestion.flagIds.add(flagId);

    /**
     * We automatically mark the question as viewed once it has been flagged.
     * We need to gather user feedback on this once the UX is complete.
     */
    targetQuestion.hasBeenViewed = true;

    return this.applyUpdateIfPossible(
      `flag question [${questionLabel}] with flag [${flagId}]`,
    );
  }

  @UpdateMethod()
  submitPartialReview() {
    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot submit partial review [${this.id}] of survey [${this.surveyName}], as it has already been submitted.`,
      );
    }

    if (this.isComplete()) {
      return new TrueImpactError(
        `You cannot submit a parital review [${this.id}] of survey [${this.surveyName}], as the review is complete (i.e., every question's response has been marked as viewed).`,
      );
    }

    this.hasBeenSubmitted = true;

    return this;
  }

  @UpdateMethod()
  submitCompleteReview() {
    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot submit review [${this.id}] of survey [${this.surveyName}], as it has already been submitted.`,
      );
    }

    // TODO Do we want the same approach for submit partial review?
    const unreviewedQuestions = this.questionsReviewed.filter(
      (qr) => !qr.hasBeenViewed,
    );

    if (unreviewedQuestions.length > 0) {
      return new TrueImpactError(
        `You cannot submit complete review [${this.id}] of survey [${this.surveyName}], as not all questions have been reviewed. Please review questions: [${unreviewedQuestions
          .map((q) => q.label)
          .join(', ')}]`,
      );
    }

    this.hasBeenSubmitted = true;

    return this;
  }

  private applyUpdateIfPossible(action: string): this | TrueImpactError {
    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot ${action}, as review [${this.id}] of survey [${this.surveyName}] has already been submitted.`,
      );
    }

    return this;
  }

  countQuestionsViewed(): number {
    return this.questionsReviewed.filter((qr) => qr.hasBeenViewed).length;
  }

  isComplete(): boolean {
    return this.countQuestionsViewed() === this.questionsReviewed.length;
  }

  toPersistenceDto(): SurveyReviewPersistenceDto {
    return {
      id: this.id,
      revision: this.revision,
      hasBeenSubmitted: this.hasBeenSubmitted,
      questionsReviewed: this.questionsReviewed.map((qr) =>
        qr.toPersistenceDto(),
      ),
      generalNotes: this.generalNotes.map((gn) => gn.toPersistenceDto()),
      surveyName: this.surveyName,
      surveyParticipantCompositeIdentifier:
        this.surveyParticipantCompositeIdentifier,
    };
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return `${this.surveyName} - review [${this.id}]`;
  }

  static fromUserRequest({
    surveyResponseRecord,
  }: {
    surveyResponseRecord: SurveyResponseRecord;
  }) {
    const questions = surveyResponseRecord.responses.map(
      (responseForQuestion) =>
        SurveyQuestionReviewRecord.buildEmptyFromResponse(responseForQuestion),
    );

    const surveyName = surveyResponseRecord.survey.name;

    return new SurveyReview({
      id: undefined as unknown as string,
      revision: 0,
      hasBeenSubmitted: false,
      questionsReviewed: questions,
      surveyName,
      surveyParticipantCompositeIdentifier: surveyResponseRecord.participant,
    });
  }

  static fromPersistenceDto(
    dto: SurveyReviewPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): Entity | TrueImpactError {
    const questionsReviewed = dto.questionsReviewed.map((qr) =>
      SurveyQuestionReviewRecord.fromPersistenceDto(qr, buildOptions),
    );

    const questionBuildErrors = questionsReviewed.filter(
      (qr): qr is TrueImpactError => qr instanceof TrueImpactError,
    );

    if (questionBuildErrors.length > 0) {
      return new TrueImpactError(
        `Failed to build survey review due to one or more invalid questions`,
        questionBuildErrors,
      );
    }

    const generalNotes: MultilingualText[] = [];

    const noteBuildErrors: TrueImpactError[] = [];

    dto.generalNotes.forEach((gn) => {
      const buildResult = MultilingualText.fromPersistenceDto(gn, buildOptions);

      if (buildResult instanceof TrueImpactError) {
        noteBuildErrors.push(buildResult);

        return;
      }

      generalNotes.push(buildResult);
    });

    if (noteBuildErrors.length > 0) {
      return new TrueImpactError(
        `Failed to build survey review [${dto.id}] due to invalid existing data.`,
        noteBuildErrors,
      );
    }

    return new SurveyReview({
      id: dto.id,
      revision: dto.revision,
      hasBeenSubmitted: dto.hasBeenSubmitted,
      questionsReviewed: questionsReviewed as SurveyQuestionReviewRecord[],
      surveyName: dto.surveyName,
      generalNotes,
      surveyParticipantCompositeIdentifier:
        dto.surveyParticipantCompositeIdentifier,
    });
  }
}
