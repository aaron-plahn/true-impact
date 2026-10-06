import { randomUUID } from 'crypto';
import { DomainEvent, EventPayload } from 'src/libs/cqrs-es';
import {
  MultilingualText,
  MultilingualTextPersistenceDto,
} from '../../../common/multilingual-text';
import {
  BooleanDataType,
  EventSourcedAggregateRoot,
  Literal,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  RawObject,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';
import { SurveyResponseRecord } from '../survey-completion';
import { SurveyParticipantCompositeIdentifier } from '../survey-completion/models/survey-participant.composite-identifier';
import {
  CompleteReviewOfSurveySubmitted,
  GeneralNoteAboutSurveyResponseAdded,
  NoteAboutQuestionResponseAdded,
  PartialReviewOfSurveySubmitted,
  ReviewOfResponseForSurveyQuestionAcknowledged,
  ReviewOfSurveyBegan,
  SurveyQuestionResponseFlagged,
} from './commands';
import { SURVEY_REVIEW_AGGREGATE_TYPE } from './constants';
import {
  SurveyQuestionReviewRecord,
  SurveyQuestionReviewRecordPersistenceDto,
} from './survey-question-review-record.entity';

class SurveyReviewPersistenceDto {
  id: string;
  eventHistory: DomainEvent[];
  revision: number;
  hasBeenSubmitted: boolean;
  questionsReviewed: SurveyQuestionReviewRecordPersistenceDto[];
  surveyName: string;
  surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
  generalNotes: MultilingualTextPersistenceDto[];
}

export class SurveyReview extends EventSourcedAggregateRoot {
  @Literal(SURVEY_REVIEW_AGGREGATE_TYPE, {
    label: 'type',
    description:
      'distinguishes survey reviews from other types of entity in our system',
  })
  readonly type = SURVEY_REVIEW_AGGREGATE_TYPE;

  @RawObject({
    label: 'event history',
    description: 'audit log of all changes ever made to this survey review',
    isArray: true,
    isOptional: true, // i.e. can be empty - can it?
  })
  eventHistory: DomainEvent<EventPayload>[];

  @NonEmptyString({
    label: 'id',
    description: 'unique identifier for this survey review',
  })
  id: string;

  @NonNegativeInteger({
    label: 'revision',
    description:
      'tracks the number of historical edits that have been made to this survey review',
  })
  revision: number;

  @BooleanDataType({
    label: 'has been submitted',
    description: 'has the reviewer submitted this review?',
  })
  hasBeenSubmitted: boolean;

  // This is only cached to build more meaningful error messages.
  @NonEmptyString({
    label: 'survey name',
    description: `name of the survey for which a client's response is being reviewed`,
  })
  surveyName: string;

  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'survey participant composite ID',
    description:
      'system-wide unique identifier for the particpant who completed this survey',
    isOptional: true,
  })
  surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;

  @NestedDataType(() => SurveyQuestionReviewRecord, {
    label: 'questions reviewed',
    description:
      'an ordered list of question responses and their review markup',
    isArray: true,
  })
  questionsReviewed: SurveyQuestionReviewRecord[];

  @NestedDataType(() => MultilingualText, {
    label: 'notes',
    description: `A list of general notes about this participant's response to this survey in general.`,
    isArray: true,
    isOptional: true, // can be empty
  })
  generalNotes: MultilingualText[] = [];

  constructor({
    id,
    eventHistory,
    revision,
    hasBeenSubmitted,
    questionsReviewed,
    surveyName,
    surveyParticipantCompositeIdentifier,
    generalNotes,
  }: {
    id: string;
    eventHistory: DomainEvent[];
    revision: number;
    hasBeenSubmitted: boolean;
    questionsReviewed: SurveyQuestionReviewRecord[];
    surveyName: string;
    surveyParticipantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
    generalNotes?: MultilingualText[];
  }) {
    super();

    this.id = id;

    this.eventHistory = eventHistory;

    this.revision = revision;

    this.questionsReviewed = questionsReviewed;

    this.surveyName = surveyName;

    this.surveyParticipantCompositeIdentifier =
      surveyParticipantCompositeIdentifier;

    if (Array.isArray(generalNotes)) {
      this.generalNotes = generalNotes;
    } else {
      generalNotes = [];
    }

    this.hasBeenSubmitted = hasBeenSubmitted;
  }

  @UpdateMethod()
  acknowledgeResponseToQuestionViewed(
    questionLabel: string,
  ): SurveyReview | TrueImpactError {
    const frozenReviewCheck = this.canUpdate(
      `mark question [${questionLabel}] as viewed`,
    );

    if (frozenReviewCheck instanceof Error) {
      return frozenReviewCheck;
    }

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

    return this.apply(
      new ReviewOfResponseForSurveyQuestionAcknowledged({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
          questionLabel,
        },
      }),
    );
  }

  handleReviewOfResponseForSurveyQuestionAcknowledged({
    payload: { questionLabel },
  }: ReviewOfResponseForSurveyQuestionAcknowledged) {
    const targetQuestion = this.questionsReviewed.find(
      (q) => q.label === questionLabel,
    );

    if (targetQuestion) {
      targetQuestion.hasBeenViewed = true;
    }

    return this;
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
    const frozenReviewCheck = this.canUpdate(
      `add a note about question [${questionLabel}]`,
    );

    if (frozenReviewCheck instanceof Error) {
      return frozenReviewCheck;
    }

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

    return this.apply(
      new NoteAboutQuestionResponseAdded({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
          questionLabel,
          note: {
            text,
            languageCode,
            translationType: 'original',
          },
        },
      }),
    );
  }

  handleNoteAboutQuestionResponseAdded({
    payload: { questionLabel, note },
  }: NoteAboutQuestionResponseAdded) {
    const targetQuestion = this.questionsReviewed.find(
      (q) => q.label === questionLabel,
    );

    const textBuildResult = MultilingualText.withText(note);

    if (textBuildResult instanceof Error) {
      return textBuildResult;
    }

    if (targetQuestion) {
      targetQuestion.notes.push(textBuildResult);

      /**
       * We automatically mark the question as viewed once a note has been made.
       * We need to gather user feedback on this once the UX is complete.
       */
      targetQuestion.hasBeenViewed = true;
    }

    return this;
  }

  @UpdateMethod()
  addGeneralNote({
    text,
    languageCode,
  }: {
    text: string;
    languageCode: string;
  }) {
    const frozenReviewCheck = this.canUpdate(
      `add a general note about this client's survey response`,
    );

    if (frozenReviewCheck instanceof Error) {
      return frozenReviewCheck;
    }

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

    return this.apply(
      new GeneralNoteAboutSurveyResponseAdded({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
          note: {
            text,
            languageCode,
            translationType: 'original',
          },
        },
      }),
    );
  }

  handleGeneralNoteAboutSurveyResponseAdded({
    payload: { note },
  }: GeneralNoteAboutSurveyResponseAdded) {
    const textBuildResult = MultilingualText.withText(note);

    if (textBuildResult instanceof Error) {
      return textBuildResult;
    }

    this.generalNotes.push(textBuildResult);

    return this;
  }

  @UpdateMethod()
  flagResponseToQuestion({
    questionLabel,
    flagId,
  }: {
    questionLabel: string;
    flagId: string;
  }): SurveyReview | TrueImpactError {
    const frozenReviewCheck = this.canUpdate(
      `flag question [${questionLabel}] with flag [${flagId}]`,
    );

    if (frozenReviewCheck instanceof Error) {
      return frozenReviewCheck;
    }

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

    return this.apply(
      new SurveyQuestionResponseFlagged({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
          questionLabel,
          flagId,
        },
      }),
    );
  }

  handleSurveyQuestionResponseFlagged({
    payload: { questionLabel, flagId },
  }: SurveyQuestionResponseFlagged) {
    const targetQuestion = this.questionsReviewed.find(
      (q) => q.label === questionLabel,
    );

    if (targetQuestion) {
      targetQuestion.flagIds.add(flagId);

      /**
       * We automatically mark the question as viewed once it has been flagged.
       * We need to gather user feedback on this once the UX is complete.
       */
      targetQuestion.hasBeenViewed = true;
    }

    return this;
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

    return this.apply(
      new PartialReviewOfSurveySubmitted({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
        },
      }),
    );
  }

  handlePartialReviewOfSurveySubmitted(_event: PartialReviewOfSurveySubmitted) {
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

    // TODO Do we want the same approach for submit partial review ?
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

    return this.apply(
      new CompleteReviewOfSurveySubmitted({
        payload: {
          aggregateCompositeIdentifier: this.getCompositeIdentifier(),
        },
      }),
    );
  }

  handleCompleteReviewOfSurveySubmitted(
    _event: CompleteReviewOfSurveySubmitted,
  ) {
    this.hasBeenSubmitted = true;

    return this;
  }

  private canUpdate(action: string): this | TrueImpactError {
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
      eventHistory: this.eventHistory,
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

  static fromReviewOfSurveyBegan(event: ReviewOfSurveyBegan) {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
        surveyName,
        responses,
        // TODO can we remove this?
        participantCompositeIdentifier,
      },
    } = event;

    const surveyQuestionErrors: TrueImpactError[] = [];

    const surveyQuestions: SurveyQuestionReviewRecord[] = [];

    responses.forEach(({ questionLabel, optionLabel }) => {
      const buildResult = SurveyQuestionReviewRecord.fromPersistenceDto({
        questionLabel,
        optionLabel,
        hasBeenViewed: false,
        notes: [],
        flagIds: [],
      });

      if (buildResult instanceof Error) {
        surveyQuestionErrors.push(buildResult);
      } else {
        surveyQuestions.push(buildResult);
      }
    });

    if (surveyQuestionErrors.length > 0) {
      return new TrueImpactError(
        `Failed to build survey review from an event history due to invalid existing data in the database.`,
        surveyQuestionErrors,
      );
    }

    return new SurveyReview({
      id,
      surveyName,
      questionsReviewed: surveyQuestions,
      generalNotes: [],
      surveyParticipantCompositeIdentifier: participantCompositeIdentifier,
      revision: 1,
      hasBeenSubmitted: false,
      eventHistory: [event],
    });
  }

  static fromEventHistory(
    eventHistory: Iterable<DomainEvent>,
  ): SurveyReview | TrueImpactError | null {
    return EventSourcedAggregateRoot.fromEventHistory.call(
      SurveyReview,
      eventHistory,
    ) as SurveyReview;
  }

  /**
   * The name is misleading here. The `surveyResponseRecord` was fetched
   * from a survey completion service **based on** the user request.
   */
  static fromUserRequest({
    surveyResponseRecord,
  }: {
    // Should this be a DTO?
    surveyResponseRecord: SurveyResponseRecord;
  }) {
    const questions = surveyResponseRecord.responses.map(
      (responseForQuestion) =>
        SurveyQuestionReviewRecord.buildEmptyFromResponse(responseForQuestion),
    );

    const surveyName = surveyResponseRecord.survey.name;

    // is this the right place?
    const id = randomUUID();

    const instance = new SurveyReview({
      id,
      eventHistory: [
        new ReviewOfSurveyBegan({
          payload: {
            aggregateCompositeIdentifier: {
              type: SURVEY_REVIEW_AGGREGATE_TYPE,
              id,
            },
            surveyName: surveyResponseRecord.survey.name,
            participantCompositeIdentifier: surveyResponseRecord.participant,
            responses: surveyResponseRecord.responses.map(
              ({ questionLabel, optionLabel }) => ({
                questionLabel,
                optionLabel,
              }),
            ),
          },
        }),
      ],
      revision: 0,
      hasBeenSubmitted: false,
      questionsReviewed: questions,
      surveyName,
      surveyParticipantCompositeIdentifier: surveyResponseRecord.participant,
    });

    return instance.validateInvariants();
  }

  static fromPersistenceDto(
    dto: SurveyReviewPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): SurveyReview | TrueImpactError {
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
      eventHistory: dto.eventHistory,
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
