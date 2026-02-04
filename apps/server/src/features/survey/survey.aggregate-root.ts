import {
  Entity,
  InvariantValidationError,
  isNonEmptyString,
  NonEmptyString,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs';
import { CreateSurvey } from './commands/create-survey.command';
import { SURVEY_AGGREGATE_TYPE } from './constants';
import {
  SurveyQuestion,
  SurveyQuestionPersistenceDto,
} from './survey-question.entity';

export class SurveyPersistenceDto {
  id: string;
  isPublished: boolean;
  name: string;
  questions: Record<string, SurveyQuestionPersistenceDto>;
  firstQuestionLabel?: string;
}

// TODO We need to track schema versions
/**
 * We need a system for creating and publishing drafts.
 */
@TrueImpactDataExample<SurveyPersistenceDto>({
  example: {
    id: '123',
    isPublished: false,
    name: 'test survey',
    questions: {},
    // firstQuestionLabel:
  },
})
export class Survey extends Entity {
  /**
   * This is useful in case we ever want to iterate through a global collection of
   * entities and build instances.
   */
  readonly type = SURVEY_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'Unique identifier for this survey',
    isArray: false,
    isOptional: false,
  })
  id: string;

  // @BooleanDataType
  // TODO We need a draft \ publication \ versioning work-flow
  isPublished: boolean;

  // TODO support translations?
  @NonEmptyString({
    label: 'Name',
    description: 'the name of this survey to display in lists',
    isArray: false,
    isOptional: false,
  })
  name: string;

  questions: Map<string, SurveyQuestion>;

  /**
   * Each survey question option points to a next question (or null if it is a leaf).
   * In this way, the survey is directed graph. We should validate as part of the invariant validation
   * that it is acyclic.
   *
   * If `firstQuestionLabel` is null, it is not possible to publish the survey.
   */
  firstQuestionLabel?: string;

  constructor({
    id,
    isPublished,
    name,
    questions,
    firstQuestionLabel,
  }: {
    id: string;
    isPublished: boolean;
    name: string;
    questions?: Record<string, SurveyQuestion>;
    firstQuestionLabel?: string;
  }) {
    super();

    this.id = isNonEmptyString(id) ? id : 'GENERATE_A_NEW_ID';

    this.isPublished = typeof isPublished === 'boolean' ? isPublished : false;

    this.name = name;

    // TODO Ensure that you validate the invariant rule that the `firstQuestionLabel` must be the `label` for some question in `questions.values()`
    this.firstQuestionLabel = firstQuestionLabel;

    this.questions = new Map(Object.entries(questions || {}));
  }

  getId(): string {
    /**
     * This shouldn't happen, but we want to be safe.
     * The problem is that an initial instance doesn't have an ID until it is persisted to the database
     * unless we introduce an explicit ID generation service, which complicates the work flow.
     */
    if (this.id === 'GENERATE_A_NEW_ID') {
      // This ensures attempts to persist will fail without any need for type checking upstream
      return '';
    }

    return this.id;
  }

  getName(): string {
    return this.name;
  }

  /**
   * returns the number of questions in this survey
   */
  size(): number {
    return this.questions.size;
  }

  toPersistenceDto(): SurveyPersistenceDto {
    const result: SurveyPersistenceDto = {
      id: this.id,
      name: this.name,
      isPublished: this.isPublished,
      // We persist maps as plain objects (lookup tables)
      questions: Array.from(this.questions.entries()).reduce(
        (
          acc: Record<string, SurveyQuestionPersistenceDto>,
          [label, question],
        ) => {
          acc[label] = question.toPersistenceDto();

          return acc;
        },
        {},
      ),
      firstQuestionLabel: this.firstQuestionLabel,
    };

    return result;
  }

  getFirstQuestion(): SurveyQuestion | null {
    if (typeof this.firstQuestionLabel === 'undefined') {
      return null;
    }

    return this.questions.get(this.firstQuestionLabel) || null;
  }

  get(questionLabel: string): SurveyQuestion | null {
    return this.questions.get(questionLabel) || null;
  }

  /**
   *
   * @param questionLabel the label of the target question
   * @param optionLabel the label of the selected option
   * @returns the follow-up question to ask
   */
  next(questionLabel: string, optionLabel: string): SurveyQuestion | null {
    const followUpQuestionLabel =
      this.get(questionLabel)?.get(optionLabel)?.followUpQuestionLabel;

    if (!followUpQuestionLabel) {
      return null;
    }

    return this.get(followUpQuestionLabel);
  }

  setInitialId(generatedId: string): Survey | TrueImpactError {
    if (this.id !== 'GENERATE_A_NEW_ID') {
      return new TrueImpactError(
        `Cannot overwrite id: ${this.id} with generated ID: ${generatedId}`,
      );
    }

    this.id = generatedId;

    return this;
  }

  // should this be a bad user input error?
  @UpdateMethod()
  addFirstQuestion(userRequest: {
    label: string;
    prompt: string;
  }): Survey | TrueImpactError {
    if (this.size() !== 0) {
      return new TrueImpactError(
        `You cannot add question [${userRequest.label}] as the first question in survey [${this.name}], as there is it already has a first question: ${this.firstQuestionLabel}.`,
      );
    }

    const questionBuildResult =
      SurveyQuestion.fromAddQuestionToSurvey(userRequest);

    if (questionBuildResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([questionBuildResult]);
    }

    this.questions.set(questionBuildResult.label, questionBuildResult);

    this.firstQuestionLabel = questionBuildResult.label;

    return this;
  }

  @UpdateMethod()
  addOptionToQuestion(userRequest: {
    questionLabel: string;
    optionLabel: string;
    text: string;
  }): Survey | TrueImpactError {
    const { questionLabel } = userRequest;

    if (!this.questions.has(questionLabel)) {
      return new TrueImpactError(
        `You cannot add option [${userRequest.optionLabel}] to survey[${this.name}] as it has no question with the label [${userRequest.questionLabel}].`,
      );
    }

    const targetQuestion = this.questions.get(questionLabel) as SurveyQuestion;

    const updatedQuestion = targetQuestion.addOption(userRequest);

    if (updatedQuestion instanceof TrueImpactError) {
      return updatedQuestion;
    }

    this.questions.set(questionLabel, updatedQuestion);

    return this;
  }

  @UpdateMethod()
  addWeightsForOptionInQuestion({
    questionLabel,
    optionLabel,
    weights,
  }: {
    questionLabel: string;
    optionLabel: string;
    weights: Record<string, number>;
  }): this | TrueImpactError {
    const targetQuestion =
      this.get(questionLabel) ||
      new TrueImpactError(
        `You cannot add weights to question [${questionLabel}] as there is no such question in survey [${this.name}]`,
      );

    if (targetQuestion instanceof TrueImpactError) {
      return targetQuestion;
    }

    const updatedQuestion = targetQuestion?.addWeightsForOption({
      optionLabel,
      weights,
    });

    if (updatedQuestion instanceof TrueImpactError) {
      return updatedQuestion;
    }

    this.questions.set(questionLabel, updatedQuestion);

    return this;
  }

  static fromPersistenceDto({
    id,
    isPublished,
    name,
    questions,
    firstQuestionLabel,
  }: SurveyPersistenceDto): Survey | TrueImpactError {
    return new Survey({
      id,
      isPublished,
      name,
      firstQuestionLabel,
      questions: Object.entries(questions).reduce(
        (acc: Record<string, SurveyQuestion>, [label, questionDto]) => {
          acc[label] = SurveyQuestion.fromPersistenceDto(questionDto);

          return acc;
        },
        {},
      ),
    });
  }

  @UpdateMethod()
  addFollowUpQuestion({
    optionLabel,
    questionLabel,
    followUpQuestion,
  }: {
    questionLabel: string;
    optionLabel: string;
    followUpQuestion: { label: string; prompt: string };
  }): this | TrueImpactError {
    this.questions.set(
      followUpQuestion.label,
      SurveyQuestion.fromAddQuestionToSurvey(
        followUpQuestion,
      ) as SurveyQuestion,
    );

    const updatedQuestion =
      this.get(questionLabel)?.addFollowUpQuestionForOption({
        optionLabel,
        followUpQuestionLabel: followUpQuestion.label,
      }) ||
      new TrueImpactError(
        `You cannot add a follow-up question to option [${optionLabel}] for question [${questionLabel}] as there is no such question in survey [${this.name}]`,
      );

    if (updatedQuestion instanceof TrueImpactError) {
      return updatedQuestion;
    }

    this.questions.set(questionLabel, updatedQuestion);

    return this;
  }

  @UpdateMethod()
  addFlagToQuestionOption({
    questionLabel,
    optionLabel,
    flagId,
  }: {
    questionLabel: string;
    optionLabel: string;
    /**
     * Flags have an identity that spans other parts of the system. Further, flags can
     * be updated independently of the surveys in which they appear and can be reused
     * across surveys. For that reason, they are treated as aggregate roots in their
     * own right. Relabelling or modifying a flag's description externally to a survey
     * will update it's appearence within surveys to which it is attached.
     */
    flagId: string;
  }): this | TrueImpactError {
    const updatedQuestion =
      this.get(questionLabel) ||
      new TrueImpactError(
        `You cannot add flag [${flagId}] to option [${optionLabel}] for question [${questionLabel}] as there is no such question in survey [${this.name}]`,
      );

    if (updatedQuestion instanceof TrueImpactError) {
      return updatedQuestion;
    }

    const targetOption =
      updatedQuestion?.get(optionLabel) ||
      new TrueImpactError(
        `You cannot add flag [${flagId}] to option [${optionLabel}] for question [${questionLabel}] in survey [${this.name}] as there is no such option`,
      );

    if (targetOption instanceof TrueImpactError) {
      return targetOption;
    }

    const updatedOption = targetOption.addFlag(flagId);

    if (updatedOption instanceof TrueImpactError) {
      return new TrueImpactError(
        `Failed to add [${flagId}] to option [${optionLabel}] for question [${questionLabel}] in survey [${this.name}]`,
        [updatedOption],
      );
    }

    updatedQuestion.options.set(optionLabel, updatedOption);

    this.questions.set(questionLabel, updatedQuestion);

    return this;
  }

  @UpdateMethod()
  publish(): this | TrueImpactError {
    if (this.isPublished) {
      return new TrueImpactError(
        `You cannot publish survey [${this.name}], as it is already published`,
      );
    }

    this.isPublished = true;

    return this;
  }

  validatePublicationStatus(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    /**
     * There are no restrictions to validate if the survey is unpublished
     */
    if (!this.isPublished) {
      return allErrors;
    }

    if (this.size() < 1) {
      allErrors.push(
        new TrueImpactError(
          `A survey must have at least 1 question in order to be published`,
        ),
      );
    }

    const MIN_NUMBER_OF_OPTIONS = 2;

    const tooFewOptionsErrors = Array.from(this.questions.values()).flatMap(
      (q: SurveyQuestion) => {
        const questionSize = q.size();

        return questionSize < MIN_NUMBER_OF_OPTIONS
          ? [
              new TrueImpactError(
                `Survey [${this.name}] cannot be published as its question [${q.label}] does not have at least ${MIN_NUMBER_OF_OPTIONS} options. It has ${questionSize} options.`,
              ),
            ]
          : [];
      },
    );

    allErrors.push(...tooFewOptionsErrors);

    return allErrors;
  }

  /**
   * - A Survey can not be published if it has no `firstQuestion`.
   * - A Survey must constitute an acyclic graph via its questions. That is, no `SurveyOption.next` should point to a previous
   * question in the survey.
   * - A published survey's questions must offer at least 2 options each
   */
  validateComplexInvariants(): TrueImpactError[] {
    return [...this.validatePublicationStatus()];
  }

  static fromCreateSurveyCommand({
    name,
  }: CreateSurvey): Survey | InvariantValidationError {
    const instance = new Survey({
      id: 'GENERATE_A_NEW_ID',
      isPublished: false,
      name,
      questions: {},
    });

    return instance.validateInvariants();
  }
}
