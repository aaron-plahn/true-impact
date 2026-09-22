import { Optional } from '@nestjs/common';
import { DomainEvent } from '../../../../libs/cqrs-es';
import {
  BooleanDataType,
  buildTestInstance,
  Entity,
  EventSourcedAggregateRoot,
  InvariantValidationError,
  Literal,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  RawObject,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../../../libs/data-types';
import { CLIENT_AGGREGATE_TYPE } from '../../../clients/client.composite-identifier';
import { DONE, SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../constants';
import { SurveyQuestion } from '../../survey-management/survey-question.entity';
import {
  Survey,
  SurveyPersistenceDto,
} from '../../survey-management/survey.aggregate-root';
import {
  SurveyBegan,
  SurveyCompletionAbandoned,
  SurveyCompletionAbandonedPayload,
  SurveyCompletionCancelled,
  SurveyQuestionAnswered,
  SurveySubmitted,
} from '../commands';
import { SurveyParticipantCompositeIdentifier } from './survey-participant.composite-identifier';

class SurveyQuestionResponsePersistenceDto {
  questionLabel: string;
  optionLabel: string;
}

export class SurveyResponseCompositeIdentifier {
  @Literal(SURVEY_RESPONSE_AGGREGATE_TYPE, {
    label: 'type',
    description: 'type',
  })
  readonly type = SURVEY_RESPONSE_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: `unique system identifier for this survey attempt`,
  })
  id: string;
}

class SurveyQuestionResponse extends Entity {
  /**
   * Order is crucial here.
   */
  // TODO make `revision` a getter now.
  @RawObject({
    label: 'event history',
    description: 'audit log containing all historical edits of this survey',
    isArray: true,
    // TODO rename this `canBeEmpty` for Array valued props?
    isOptional: true, // i.e. can be empty
  })
  eventHistory: DomainEvent[] = [];

  @NonEmptyString({
    label: 'question label',
    description: 'label for the question being answered',
  })
  questionLabel: string;

  @NonEmptyString({
    label: 'option label',
    description: 'label for the option the participant has chosen',
  })
  optionLabel: string;

  constructor({
    questionLabel,
    optionLabel,
  }: {
    questionLabel: string;
    optionLabel: string;
  }) {
    super();

    this.questionLabel = questionLabel;

    this.optionLabel = optionLabel;
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    return allErrors;
  }

  getId(): string {
    return `${this.questionLabel}:${this.optionLabel}`;
  }

  getName(): string {
    return this.getId();
  }

  toPersistenceDto(): SurveyQuestionResponsePersistenceDto {
    return {
      questionLabel: this.questionLabel,
      optionLabel: this.optionLabel,
    };
  }

  static fromPersistenceDto(
    {
      questionLabel,
      optionLabel,
    }: {
      questionLabel: string;
      optionLabel: string;
    },
    buildOptions: { shouldValidate?: boolean } = {},
  ): SurveyQuestionResponse | TrueImpactError {
    const result = new SurveyQuestionResponse({
      questionLabel,
      optionLabel,
    });

    if (buildOptions.shouldValidate) {
      return result.validateInvariants();
    }

    return result;
  }
}

export class SurveyResponseRecordPersistenceDto {
  id: string;

  revision: number;

  eventHistory: DomainEvent[];

  /**
   * We should have a different structural model of surveys for response validation.
   * In part, we should hide irrelevant fields such as `flagIds`, `accessTokens`, and `analyzers`.
   *
   * One challenge that arises is the need to reuse logic for getting the next question.
   *
   * We reused the survey domain model to make quick work of this.
   */
  survey: SurveyPersistenceDto;

  // TODO the following 3 boolean flags have consistency rules that we should validate in "validateComplexInvariants"
  hasBeenAbandoned: boolean;

  hasBeenCancelled: boolean;

  submissionTimestamp?: number;

  /**
   * In the future, participants may be an `Employee`, `CommunityEmployee`, etc. We don't want
   * to assume that surveys can only be completed by a client.
   */

  /**
   * We have decided not to do this because we may end up having only read-only access to the SSTO for client management (possibly external).
   * Also, surveys can potentially be completed anonymously, so their response records need to be persisted independent of a subject in at least
   * some cases.
   *
   * Note that we can attach survey responses to their subjects in the view layer.
   */
  participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;

  responses: SurveyQuestionResponse[];

  nextQuestionLabel: string | undefined;
}

const testSurveyExample = buildTestInstance(Survey, {
  isFinal: false,
});

@TrueImpactDataExample<SurveyResponseRecordPersistenceDto>({
  example: {
    id: '123',
    revision: 5,
    /**
     * TODO Can `buildTestInstance` use the schema to recurse on missing nested properties?
     */
    survey: testSurveyExample.toPersistenceDto(),
    hasBeenAbandoned: false,
    hasBeenCancelled: false,
    participantCompositeIdentifier: {
      type: CLIENT_AGGREGATE_TYPE,
      id: '55',
    },
    // empty by default
    responses: [],
    eventHistory: [],
    nextQuestionLabel: '1',
  },
})
export class SurveyResponseRecord extends EventSourcedAggregateRoot {
  @NonEmptyString({
    label: 'type',
    description: SURVEY_RESPONSE_AGGREGATE_TYPE,
  })
  // @Literal
  // this is hard wired. there's no need to validate it.
  static readonly type = SURVEY_RESPONSE_AGGREGATE_TYPE;

  // This is required in the persistence DTO, but optional here because it is generated upon creation in the database
  @NonEmptyString({
    label: 'ID',
    description: 'unique system identifier for a survey attempt',
  })
  id: string;

  @NonNegativeInteger({
    label: 'revision number',
    description:
      'a version number that tracks the changes to this survey attempt',
  })
  revision: number;

  /**
   * Note that when a participant begins a survey, the target survey is copied here
   * as a value object. Surveys are currently immutable and in the future will be fully
   * versioned.
   *
   * Technically, we should build a specific `SurveyRecordForResponse` that doesn't have `flags`, `analyzers` or any
   * irrelevant information that can be edited after the survey is `finalized` for use. We avoid accessing these to
   * validate survey responses by convention at present.
   */
  @NestedDataType(() => Survey, {
    label: 'survey',
    description: 'a copy of the survey the user is completing',
  })
  survey: Survey;

  @NonEmptyString({
    label: 'survey version',
    description:
      'tracks whether an older version of the given survey was completed',
  })
  surveyVersion = '1';

  @NonEmptyString({
    label: 'survey schema version',
    description:
      'tracks whether the internal format of the survey schema has been changed since this survey was started',
  })
  surveySchemaVersion = '1.0.0';

  @NestedDataType(() => SurveyParticipantCompositeIdentifier, {
    label: 'participant identifier',
    description:
      'unique system-wide identifier for the subject completing this survey',
    isOptional: true,
  })
  participant?: SurveyParticipantCompositeIdentifier;

  /**
   * We store these in an array to also track the order
   * in which questions have been answered for easier validation.
   */
  @NestedDataType(() => SurveyQuestionResponse, {
    label: 'responses',
    description: `an ordered list of the participant's answers to survey questions`,
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  responses: SurveyQuestionResponse[];

  @BooleanDataType({
    label: 'has been abandoned',
    description: 'has this survey been abandoned?',
  })
  hasBeenAbandoned: boolean;

  @BooleanDataType({
    label: 'has been cancelled',
    description:
      'has this survey been cancelled in favor of an additional attempt of the same survey?',
  })
  hasBeenCancelled: boolean;

  /**
   * Note that there is no need for schema-based validation of this. It
   * is calculated and could be a getter, except for the fact that it is easier
   * to cache this each time a new question is answered. We do not
   * persist this to the database.
   *
   * We need to find a way to opt out of validation of getter-like properties.
   */
  @NonEmptyString({
    label: 'next question label',
    description: 'refers to the next question that the user should answer',
    isOptional: true,
  })
  nextQuestionLabel?: string; // possibly `DONE`

  get hasBeenSubmitted(): boolean {
    return typeof this.submissionTimestamp !== 'undefined';
  }

  @NonNegativeInteger({
    label: 'time of submission',
    description:
      'records the date and time the client submitted this survey attempt',
    isOptional: true, // omitted if the client has yet to complete the survey
  })
  submissionTimestamp?: number;

  // TODO move to base class
  @RawObject({
    label: 'event history',
    description: 'audit log of historical edits to this survey response',
  })
  // What is the purpose of `IDomainEvent`?
  eventHistory: DomainEvent[];

  constructor(dto: {
    id: string;
    revision: number;
    hasBeenAbandoned: boolean;
    hasBeenCancelled: boolean;
    submissionTimestamp?: number;
    survey: Survey;
    // surveys may be anonymous
    participant?: SurveyParticipantCompositeIdentifier;
    responses: SurveyQuestionResponse[];
    eventHistory: DomainEvent[];
    nextQuestionLabel: string | undefined;
  }) {
    const {
      id,
      revision,
      hasBeenAbandoned,
      hasBeenCancelled,
      submissionTimestamp,
      survey,
      responses,
      participant,
      eventHistory,
      nextQuestionLabel,
    } = dto;

    super(dto);

    if (typeof id === 'string') {
      this.id = id;
    }

    this.survey = survey;

    this.revision = revision;

    this.responses = responses;

    this.hasBeenAbandoned =
      typeof hasBeenAbandoned === 'boolean' ? hasBeenAbandoned : false;

    this.hasBeenCancelled =
      typeof hasBeenCancelled === 'boolean' ? hasBeenCancelled : false;

    this.submissionTimestamp = submissionTimestamp;

    this.eventHistory = eventHistory;

    if (participant) {
      this.participant = {
        type: participant.type,
        id: participant.id,
      };
    }

    this.nextQuestionLabel = nextQuestionLabel;
  }

  // TODO base class?
  getAggregateCompositeIdentifier() {
    return {
      type: SURVEY_RESPONSE_AGGREGATE_TYPE,
      id: this.id,
    };
  }

  handleSurveyQuestionAnswered({
    payload: { questionLabel, chosenOptionLabel },
  }: SurveyQuestionAnswered) {
    this.responses.push(
      SurveyQuestionResponse.fromPersistenceDto({
        questionLabel,
        optionLabel: chosenOptionLabel,
      }) as SurveyQuestionResponse,
    );

    if (!this.isComplete()) {
      this.nextQuestionLabel = this.survey.getNextQuestionLabel(
        questionLabel,
        chosenOptionLabel,
      ) as string;
    } else {
      this.nextQuestionLabel = DONE;
    }

    return this;
  }

  answerQuestion(
    questionLabel: string,
    chosenOptionLabel: string,
  ): SurveyResponseRecord | TrueImpactError {
    console.log({ answerQuestion: questionLabel, withOption: Optional });

    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}], as the survey has already been submitted.`,
      );
    }

    if (this.hasBeenAbandoned) {
      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}], as the survey has been abandoned.`,
      );
    }

    if (!this.survey.has(questionLabel)) {
      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}], as there is no such question.`,
      );
    }

    const targetQuestion = this.survey.get(questionLabel) as SurveyQuestion;

    if (!targetQuestion.has(chosenOptionLabel)) {
      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] with the response option [${chosenOptionLabel}] in survey [${this.survey.name}], as there is no such option`,
      );
    }

    if (this.hasResponseFor(questionLabel)) {
      const optionLabelForExistingQuestionAnswer = this.responses.find(
        (r) => r.questionLabel === questionLabel,
      )?.optionLabel as string;

      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}] with option [${chosenOptionLabel}], as it already has been answered with option [${optionLabelForExistingQuestionAnswer}]`,
      );
    }

    if (questionLabel !== this.nextQuestionLabel) {
      console.log(
        `You were supposed to answer question ${this.nextQuestionLabel} next in survey: ${JSON.stringify(this.survey.toPersistenceDto())}`,
      );

      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}], as it is not the next question ([${this.nextQuestionLabel as string}])`,
      );
    }

    return this.apply(
      new SurveyQuestionAnswered({
        payload: {
          aggregateCompositeIdentifier:
            // TODO deal with the chicken-and-egg problem of IDs
            this.getAggregateCompositeIdentifier() as SurveyResponseCompositeIdentifier,
          questionLabel,
          chosenOptionLabel,
        },
      }),
    );
  }

  handleSurveySubmitted(event: SurveySubmitted) {
    this.submissionTimestamp = event.metadata.dateEffective;

    return this;
  }

  submit(): SurveyResponseRecord | TrueImpactError {
    if (this.hasBeenAbandoned) {
      return new TrueImpactError(
        `You cannot submit survey [${this.survey.name}], as it has been abandoned`,
      );
    }

    if (!this.isComplete()) {
      return new TrueImpactError(
        `You cannot submit survey [${this.survey.name}], as it has not been fully completed`,
      );
    }

    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot submit survey [${this.survey.name}], as it has already been submitted`,
      );
    }

    this.apply(
      new SurveySubmitted({
        metadata: {
          dateEffective: Date.now(),
        },
        payload: {
          aggregateCompositeIdentifier:
            this.getAggregateCompositeIdentifier() as SurveyResponseCompositeIdentifier,
        },
      }),
    );

    return this;
  }

  handleSurveyCompletionCancelled(_event: SurveyCompletionCancelled) {
    this.hasBeenCancelled = true;

    return this;
  }

  cancel({
    replacementAttemptId,
  }: {
    replacementAttemptId: string;
  }): SurveyResponseRecord | TrueImpactError {
    if (this.hasBeenAbandoned) {
      return new TrueImpactError(
        `You cannot cancel survey [${this.survey.name}], as it has already been abandoned`,
      );
    }

    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot cancel survey [${this.survey.name}], as it has already been submitted`,
      );
    }

    return this.apply(
      new SurveyCompletionCancelled({
        payload: {
          aggregateCompositeIdentifier:
            this.getAggregateCompositeIdentifier() as SurveyResponseCompositeIdentifier,
          nextAttemptId: replacementAttemptId,
        },
      }),
    );
  }

  handleSurveyCompletionAbandoned(_event: SurveyCompletionAbandoned) {
    this.hasBeenAbandoned = true;

    return this;
  }

  abandon(): SurveyResponseRecord | TrueImpactError {
    if (this.hasBeenAbandoned) {
      return new TrueImpactError(
        `You cannot abandon survey [${this.survey.name}], as it has already been abandoned`,
      );
    }

    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot abandon survey [${this.survey.name}], as it has already been submitted`,
      );
    }

    const event: DomainEvent<SurveyCompletionAbandonedPayload> =
      new SurveyCompletionAbandoned({
        payload: {
          aggregateCompositeIdentifier:
            this.getAggregateCompositeIdentifier() as SurveyResponseCompositeIdentifier,
        },
      });

    // Where do invariants get validated?
    return this.apply(event);
  }

  hasResponseFor(questionLabel: string) {
    return this.responses.some((r) => r.questionLabel === questionLabel);
  }

  getResponseFor(questionLabel: string): string | undefined {
    return this.responses.find((r) => r.questionLabel === questionLabel)
      ?.optionLabel;
  }

  /**
   * A survey completion record should
   * - carry responses in the correct order
   *
   * A complete record should
   * - have one response for each question in the survey
   */
  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    if (this.survey.size() === 0) {
      allErrors.push(
        new TrueImpactError(
          `You cannot respond to survey [${this.survey.name}] as it has no questions.`,
        ),
      );
    }

    if (!this.survey.isFinal) {
      allErrors.push(
        new TrueImpactError(
          `You cannot respond to survey [${this.survey.name}] as it has not been finalized`,
        ),
      );
    }

    if (this.hasBeenSubmitted) {
      if (this.hasBeenAbandoned) {
        allErrors.push(
          new TrueImpactError(
            `Survey [${this.survey.name}] cannot be marked as submitted and abandoned`,
          ),
        );
      }

      if (this.hasBeenCancelled) {
        allErrors.push(
          new TrueImpactError(
            `Survey [${this.survey.name}] cannot be marked as submitted and cancelled.`,
          ),
        );
      }

      const isComplete = this.isComplete();

      if (isComplete) {
        if (this.survey.size() === 0) {
          allErrors.push(
            new TrueImpactError(
              `You cannot complete survey [${this.survey.name}], as it has no questions.`,
            ),
          );
        } else {
          const firstQuestion =
            this.survey.getFirstQuestion() as SurveyQuestion;

          let currentQuestionLabel: string = firstQuestion.label;

          let currentResponse: string | undefined;

          while (currentQuestionLabel !== DONE) {
            currentResponse = this.getResponseFor(currentQuestionLabel);

            if (!currentResponse) {
              allErrors.push(
                new TrueImpactError(
                  `Response for survey [${this.survey.name}] is missing an answer for required question [${currentQuestionLabel}]`,
                ),
              );

              break;
            }

            currentQuestionLabel = this.survey.getNextQuestionLabel(
              currentQuestionLabel,
              currentResponse,
            ) as string;
          }

          if (currentQuestionLabel !== DONE && currentResponse) {
            allErrors.push(
              new TrueImpactError(
                `Response for survey [${this.survey.name}] is missing an answer for required question [${this.survey.getNextQuestionLabel(currentQuestionLabel, currentResponse) as string}]`,
              ),
            );
          }
        }
      }

      if (!isComplete) {
        allErrors.push(
          new TrueImpactError(
            `Survey [${this.survey.name}] cannot be marked as submitted as it is not complete.`,
          ),
        );
      }
    }

    if (this.hasBeenCancelled && this.hasBeenAbandoned) {
      allErrors.push(
        new TrueImpactError(
          `Response for survey [${this.survey.name}] cannot be marked as cancelled and abandoned`,
        ),
      );
    }

    return allErrors;
  }

  getName(): string {
    return this.survey.name;
  }

  progress(): { completed: number; count: number } {
    const completed = this.responses.length;

    return {
      completed,
      count: this.survey.size(),
    };
  }

  isComplete(): boolean {
    return this.nextQuestionLabel === DONE;
  }

  getNextQuestionLabel(): string | undefined {
    return this.nextQuestionLabel;
  }

  toPersistenceDto(): SurveyResponseRecordPersistenceDto {
    return {
      id: this.id,
      revision: this.revision,
      survey: this.survey.toPersistenceDto(),
      hasBeenAbandoned: this.hasBeenAbandoned,
      hasBeenCancelled: this.hasBeenCancelled,
      submissionTimestamp: this.submissionTimestamp,
      participantCompositeIdentifier: this.participant,
      responses: this.responses,
      eventHistory: this.eventHistory,
      nextQuestionLabel: this.nextQuestionLabel,
    };
  }

  // TODO remove this and use event history or a "builder pattern" to set up all tests
  static fromPersistenceDto(
    {
      id,
      revision,
      hasBeenAbandoned,
      hasBeenCancelled,
      submissionTimestamp,
      survey,
      responses,
      participantCompositeIdentifier,
      eventHistory,
      nextQuestionLabel,
    }: SurveyResponseRecordPersistenceDto,
    buildOptions: { shouldValidate?: boolean } = {},
  ): SurveyResponseRecord | TrueImpactError {
    const surveyBuildResult = Survey.fromPersistenceDto(survey, buildOptions);

    if (surveyBuildResult instanceof TrueImpactError) {
      return surveyBuildResult;
    }

    const questionResponses = responses.map((r) =>
      SurveyQuestionResponse.fromPersistenceDto(r, buildOptions),
    );

    const questionResponseErrors = questionResponses.filter(
      (qr): qr is TrueImpactError => qr instanceof TrueImpactError,
    );

    if (questionResponseErrors.length > 0) {
      return new InvariantValidationError(
        SurveyResponseRecord,
        `response for: ${survey.name}`,
        questionResponseErrors,
      );
    }

    /**
     * In the future, we will want to validate
     * survey.isParticipantAllowed(participantCompositeIdentifier).
     *
     * While it might seem like we want to inject a full `participant` for validation,
     * we should avoid this because participants are out-of-process and there are no
     * transactionality guarantees that the specific attributes of a participant won't
     * change from under our feet. We validate that a participant of the given type exists
     * at the time the survey is started. If the participant is removed later, we can decide
     * upstream how to handle or whether to disregard the given survey.
     */

    return new SurveyResponseRecord({
      id,
      revision,
      hasBeenAbandoned,
      hasBeenCancelled,
      submissionTimestamp,
      survey: surveyBuildResult,
      responses: questionResponses as SurveyQuestionResponse[],
      participant: participantCompositeIdentifier,
      eventHistory,
      nextQuestionLabel,
    });
  }

  static begin({
    survey,
    participantCompositeIdentifier,
    id,
  }: {
    survey: Survey;
    participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
    id: string;
  }): SurveyResponseRecord | TrueImpactError {
    const allowedParticipantTypes = [CLIENT_AGGREGATE_TYPE];

    if (
      participantCompositeIdentifier &&
      !allowedParticipantTypes.includes(participantCompositeIdentifier.type)
    ) {
      return new TrueImpactError(
        `You cannot begin survey [${survey.name}], as you have provided an invalid participant type [${participantCompositeIdentifier.type}]`,
      );
    }

    if (!survey.isFinal) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot begin survey [${survey.name}], as it has not been finalized`,
        ),
      ]);
    }

    return new SurveyResponseRecord({
      id,
      survey,
      responses: [],
      revision: 0,
      hasBeenAbandoned: false,
      hasBeenCancelled: false,
      participant: participantCompositeIdentifier,
      nextQuestionLabel: survey.getFirstQuestion()?.label,
      eventHistory: [
        new SurveyBegan({
          streamId: `${SURVEY_RESPONSE_AGGREGATE_TYPE}/${id}`,
          payload: {
            aggregateCompositeIdentifier: {
              type: SURVEY_RESPONSE_AGGREGATE_TYPE,
              id,
            },
            survey: survey.toPersistenceDto(),
            participant: participantCompositeIdentifier,
          },
          // This should probably be assigned at a higher level as the current user and environment may be part of the meta
          metadata: {
            // TODO populate this
          },
        }),
      ],
    });
  }

  static fromSurveyBegan(
    creationEvent: SurveyBegan,
  ): SurveyResponseRecord | TrueImpactError {
    const {
      payload: {
        aggregateCompositeIdentifier: { id },
        survey,
        participant,
      },
    } = creationEvent;

    const surveyBuildResult = Survey.fromPersistenceDto(survey);

    if (surveyBuildResult instanceof Error) {
      return surveyBuildResult;
    }

    return new SurveyResponseRecord({
      id,
      survey: surveyBuildResult,
      /**
       * The initial aggregate root in-memory is at revision 0
       * until its creation event (revision 1) is persisted.
       */
      revision: 0,
      responses: [],
      hasBeenAbandoned: false,
      hasBeenCancelled: false,
      eventHistory: [creationEvent],
      participant,
      nextQuestionLabel: surveyBuildResult.getFirstQuestion()?.label,
    });
  }
}
