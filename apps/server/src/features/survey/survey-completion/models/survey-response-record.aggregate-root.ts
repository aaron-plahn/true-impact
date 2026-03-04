import {
  AggregateRoot,
  BooleanDataType,
  buildTestInstance,
  Entity,
  InvariantValidationError,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../../../libs/data-types';
import { CLIENT_AGGREGATE_TYPE } from '../../../clients/client.composite-identifier';
import { DONE, SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../constants';
import { SurveyQuestion } from '../../survey-management/survey-question.entity';
import {
  Survey,
  SurveyPersistenceDto,
} from '../../survey-management/survey.aggregate-root';
import { SurveyParticipantCompositeIdentifier } from './survey-participant.composite-identifier';

export class SurveyResponseCompositeIdentifier {
  readonly type = SURVEY_RESPONSE_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: `unique system identifier for this survey attempt`,
  })
  id: string;
}

class SurveyQuestionResponse extends Entity {
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

  toPersistenceDto(): unknown {
    throw new Error('Method not implemented.');
  }

  static fromPersistenceDto(
    {
      questionLabel,
      optionLabel,
    }: {
      questionLabel: string;
      optionLabel: string;
    },
    shouldValidate = false,
  ): SurveyQuestionResponse | TrueImpactError {
    const result = new SurveyQuestionResponse({
      questionLabel,
      optionLabel,
    });

    if (shouldValidate) {
      return result.validateInvariants();
    }

    return result;
  }
}

export class SurveyResponseRecordPersistenceDto {
  id: string;

  revision: number;

  survey: SurveyPersistenceDto;

  hasBeenAbandoned: boolean;

  hasBeenSubmitted: boolean;

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
}

const testSurveyExample = buildTestInstance(Survey, {
  isPublished: false,
}).toPersistenceDto();

@TrueImpactDataExample<SurveyResponseRecordPersistenceDto>({
  example: {
    id: '123',
    revision: 5,
    /**
     * TODO Can `buildTestInstance` use the schema to recurse on missing nested properties?
     */
    survey: testSurveyExample,
    hasBeenAbandoned: false,
    hasBeenSubmitted: false,
    participantCompositeIdentifier: {
      type: CLIENT_AGGREGATE_TYPE,
      id: '55',
    },
    // empty by default
    responses: [],
  },
})
export class SurveyResponseRecord extends AggregateRoot<SurveyResponseRecordPersistenceDto> {
  static readonly type = SURVEY_RESPONSE_AGGREGATE_TYPE;

  // This is required in the persistence DTO, but optional here because it is generated upon creation in the database
  @NonEmptyString({
    label: 'ID',
    description: 'unique system identifier for a survey attempt',
  })
  id?: string;

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

  // Surveys may be anonymous in the future
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

  /**
   * Note that there is no need for schema-based validation of this. It
   * is calculated and could be a getter, except for the fact that it is easier
   * to cache this each time a new question is answered. We do not
   * persist this to the database.
   */
  nextQuestionLabel: string | DONE;

  @BooleanDataType({
    label: 'has been submitted',
    description: 'has this survey been submitted?',
  })
  hasBeenSubmitted = false;

  constructor({
    id,
    revision,
    hasBeenAbandoned,
    survey,
    responses,
    hasBeenSubmitted,
    participant,
  }: {
    id?: string;
    revision: number;
    hasBeenAbandoned: boolean;
    survey: Survey;
    // surveys may be anonymous
    participant?: SurveyParticipantCompositeIdentifier;
    responses: SurveyQuestionResponse[];
    hasBeenSubmitted?: boolean;
  }) {
    super();

    if (typeof id === 'string') {
      this.id = id;
    }

    this.survey = survey;

    this.revision = revision;

    this.responses = responses;

    this.hasBeenAbandoned =
      typeof hasBeenAbandoned === 'boolean' ? hasBeenAbandoned : false;

    this.hasBeenSubmitted =
      typeof hasBeenSubmitted === 'boolean' ? hasBeenSubmitted : false;

    if (participant) {
      this.participant = {
        type: participant.type,
        id: participant.id,
      };
    }

    if (responses.length < survey.size()) {
      if (responses.length > 0) {
        const { questionLabel, optionLabel } = responses[responses.length - 1];

        /**
         * This assumes that the incoming DTO is valid.
         */
        this.nextQuestionLabel = survey.getNextQuestionLabel(
          questionLabel,
          optionLabel,
        ) as string;
      } else {
        // We have no responses, so the next question is the first one in the survey
        this.nextQuestionLabel = (
          survey.getFirstQuestion() as SurveyQuestion
        ).label;
      }
    } else {
      this.nextQuestionLabel = DONE;
    }
  }

  @UpdateMethod()
  answerQuestion(
    questionLabel: string,
    chosenOptionLabel: string,
  ): SurveyResponseRecord | TrueImpactError {
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
      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}], as it is not the next question ([${this.nextQuestionLabel as string}])`,
      );
    }

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

  @UpdateMethod()
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

    this.hasBeenSubmitted = true;

    return this;
  }

  @UpdateMethod()
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

    this.hasBeenAbandoned = true;

    return this;
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

    if (!this.survey.isPublished) {
      allErrors.push(
        new TrueImpactError(
          `You cannot respond to survey [${this.survey.name}] as it has not been published`,
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

      const isComplete = this.isComplete();

      if (isComplete) {
        if (this.survey.size() === 0) {
          allErrors.push(
            new TrueImpactError(
              `You cannot complete survey [${this.survey.name}], as it has no questions.`,
            ),
          );
        }

        const firstQuestion = this.survey.getFirstQuestion() as SurveyQuestion;

        let currentQuestionLabel: string | DONE = firstQuestion.label;

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
          ) as string | DONE;
        }

        if (currentQuestionLabel !== DONE && currentResponse) {
          allErrors.push(
            new TrueImpactError(
              `Response for survey [${this.survey.name}] is missing an answer for required question [${this.survey.getNextQuestionLabel(currentQuestionLabel, currentResponse) as string}]`,
            ),
          );
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

    return allErrors;
  }

  getName(): string {
    return this.survey.getName();
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

  getNextQuestionLabel(): string | DONE {
    return this.nextQuestionLabel;
  }

  toPersistenceDto(): SurveyResponseRecordPersistenceDto {
    return {
      // @ts-expect-error We want this to be required, except on the first persistence. Is there a way to achieve this?
      id: this.id,
      revision: this.revision,
      survey: this.survey.toPersistenceDto(),
      hasBeenAbandoned: this.hasBeenAbandoned,
      hasBeenSubmitted: this.hasBeenSubmitted,
      participantCompositeIdentifier: this.participant,
      responses: this.responses,
    };
  }

  static fromPersistenceDto(
    {
      id,
      revision,
      hasBeenAbandoned,
      hasBeenSubmitted,
      survey,
      responses,
      participantCompositeIdentifier,
    }: SurveyResponseRecordPersistenceDto,
    shouldValidate: boolean,
  ): SurveyResponseRecord | TrueImpactError {
    const surveyBuildResult = Survey.fromPersistenceDto(survey, shouldValidate);

    if (surveyBuildResult instanceof TrueImpactError) {
      return surveyBuildResult;
    }

    const questionResponses = responses.map((r) =>
      SurveyQuestionResponse.fromPersistenceDto(r, shouldValidate),
    );

    const questionResponseErrors = questionResponses.filter(
      (qr): qr is TrueImpactError => qr instanceof TrueImpactError,
    );

    if (questionResponseErrors.length > 0) {
      return new InvariantValidationError(
        SurveyResponseRecord,
        questionResponseErrors,
      );
    }

    return new SurveyResponseRecord({
      id,
      revision: revision,
      hasBeenAbandoned,
      hasBeenSubmitted,
      survey: surveyBuildResult,
      responses: questionResponses as SurveyQuestionResponse[],
      participant: participantCompositeIdentifier,
    });
  }

  static begin(
    survey: Survey,
    participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier,
  ): SurveyResponseRecord | TrueImpactError {
    const allowedParticipantTypes = [CLIENT_AGGREGATE_TYPE];

    if (
      participantCompositeIdentifier &&
      !allowedParticipantTypes.includes(participantCompositeIdentifier.type)
    ) {
      return new TrueImpactError(
        `You cannot begin survey [${survey.name}], as you have provided an invalid participant type [${participantCompositeIdentifier.type}]`,
      );
    }

    if (!survey.isPublished) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot begin survey [${survey.name}], as it has not been published`,
        ),
      ]);
    }

    return new SurveyResponseRecord({
      survey,
      responses: [],
      revision: 0,
      hasBeenAbandoned: false,
      hasBeenSubmitted: false,
      participant: participantCompositeIdentifier,
    });
  }
}
