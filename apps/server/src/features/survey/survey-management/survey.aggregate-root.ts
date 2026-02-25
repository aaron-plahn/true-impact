import {
  AggregateRoot,
  InvariantValidationError,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
  TrueImpactRuntimeException,
  UpdateMethod,
} from '../../../libs/data-types';
import { DONE, SURVEY_AGGREGATE_TYPE } from '../constants';
import { SurveyOption } from './survey-option.entity';
import {
  SurveyQuestion,
  SurveyQuestionPersistenceDto,
} from './survey-question.entity';

export class SurveyPersistenceDto {
  id: string;
  isPublished: boolean;
  name: string;
  questions: Record<string, Omit<SurveyQuestionPersistenceDto, 'label'>>;
  topLevelQuestionLabels: string[];
  revision: number;
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
    topLevelQuestionLabels: [],
    revision: 12,
    // firstQuestionLabel:
  },
})
export class Survey extends AggregateRoot<SurveyPersistenceDto> {
  /**
   * This is useful in case we ever want to iterate through a global collection of
   * entities and build instances.
   */
  static readonly type = SURVEY_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'Unique identifier for this survey',
    mustBeUnique: true,
  })
  id: string;

  // @BooleanDataType
  // TODO We need a draft \ publication \ versioning work-flow
  isPublished: boolean;

  @NonEmptyString({
    label: 'Name',
    description: 'the name of this survey to display in lists',
    mustBeUnique: true,
  })
  name: string;

  @NonNegativeInteger({
    label: 'revision',
    description:
      'an increasing sequence number that reflects the current version of this survey',
  })
  revision: number;

  /**
   * We may want to store the questions and follow-up questions directly in the graph.
   * We are effectively using an adjacency list approach. The main reason we did this was to avoid
   * circular build dependencies between the `SurveyQuestion` and `SurveyOption` classes. The latter would
   * have referenced the former when pointing to a follow up question. An interface or `SurveyFollowupQuestion` class
   * with the same public data type would solve this problem.
   */
  questionBank: Map<string, SurveyQuestion>;

  // See the comment about `questionBank`, which applies here as well.
  topLevelQuestionLabels: string[] = [];

  constructor({
    id,
    isPublished,
    name,
    questions,
    questionLabels,
    revision,
  }: {
    id: string;
    isPublished: boolean;
    name: string;
    revision?: number;
    questions?: Record<string, SurveyQuestion>;
    questionLabels?: string[];
  }) {
    super();

    // Why isn't this a type guard?
    if (Number.isInteger(revision)) {
      this.revision = revision as number;
    }

    this.id = id;

    this.isPublished = typeof isPublished === 'boolean' ? isPublished : false;

    this.name = name;

    // TODO Ensure that you validate the invariant rule that the `firstQuestionLabel` must be the `label` for some question in `questions.values()`
    if (Array.isArray(questionLabels)) {
      // Shallow clone of `string[]` is as good as a deep clone.
      this.topLevelQuestionLabels = [...questionLabels];
    }

    this.questionBank = new Map(Object.entries(questions || {}));
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  /**
   * returns the number of questions in this survey
   */
  size(): number {
    return this.questionBank.size;
  }

  toPersistenceDto(): SurveyPersistenceDto {
    const result: SurveyPersistenceDto = {
      id: this.id,
      name: this.name,
      isPublished: this.isPublished,
      // We persist maps as plain objects (lookup tables)
      questions: Array.from(this.questionBank.entries()).reduce(
        (
          acc: Record<string, SurveyQuestionPersistenceDto>,
          [label, question],
        ) => {
          acc[label] = question.toPersistenceDto();

          return acc;
        },
        {},
      ),
      revision: this.revision,
      topLevelQuestionLabels: this.topLevelQuestionLabels,
    };

    return result;
  }

  getFirstQuestion(): SurveyQuestion | null {
    if (this.topLevelQuestionLabels.length === 0) {
      return null;
    }

    return this.questionBank.get(this.topLevelQuestionLabels[0]) || null;
  }

  get(questionLabel: string): SurveyQuestion | null {
    return this.questionBank.get(questionLabel) || null;
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
          `You cannot publish survey [${this.name}] as a survey must have at least one question in order to be published`,
        ),
      );
    }

    const MIN_NUMBER_OF_OPTIONS = 2;

    const tooFewOptionsErrors = Array.from(this.questionBank.values()).flatMap(
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
   *
   * TODO Finalize this and add a dedicated unit test
   */
  validateComplexInvariants(): TrueImpactError[] {
    const allErrors = [...this.validatePublicationStatus()];

    /**
     * We need to walk the graph with a depth-first search and confirm that
     * every question label encountered has a corresponding question in the question bank.
     * We also need to confirm that the top level questions are indeed top level
     * questions.
     */

    return allErrors;
  }

  // should this be a bad user input error?
  @UpdateMethod()
  addTopLevelQuestion({
    label,
    prompt,
  }: {
    label: string;
    prompt: string;
  }): Survey | TrueImpactError {
    if (this.questionBank.has(label)) {
      return new TrueImpactError(
        `You cannot add top-level question [${prompt}] to survey [${this.name}], as there is already a question with the label [${label}]`,
      );
    }

    const questionBuildResult = SurveyQuestion.buildEmpty({
      label,
      prompt,
    });

    if (questionBuildResult instanceof TrueImpactError) {
      return questionBuildResult;
    }

    this.questionBank.set(questionBuildResult.label, questionBuildResult);

    this.topLevelQuestionLabels.push(questionBuildResult.label);

    return this;
  }

  find(
    questionPredicate: (question: SurveyQuestion) => boolean,
    rootQuestionLabel?: string,
  ): SurveyQuestion | null | TrueImpactError {
    if (this.size() === 0) {
      return null;
    }

    if (rootQuestionLabel && !this.questionBank.has(rootQuestionLabel)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to search survey [${this.name}], as there is no question [${rootQuestionLabel}]`,
        ),
      ]);
    }

    const firstSearchParentLabel =
      rootQuestionLabel || this.topLevelQuestionLabels[0];

    // we have already checked that this exists
    const firstSearchQuestion = this.questionBank.get(
      firstSearchParentLabel,
    ) as SurveyQuestion;

    if (questionPredicate(firstSearchQuestion)) {
      return firstSearchQuestion;
    }

    const followUpQuestionLabels =
      firstSearchQuestion.getFollowupQuestionLabels();

    for (const fuql of followUpQuestionLabels) {
      const childQuestion = this.questionBank.get(fuql);

      const nestedSearchResult = this.find(
        questionPredicate,
        childQuestion?.label,
      );

      if (nestedSearchResult instanceof TrueImpactError) {
        return nestedSearchResult;
      }

      if (nestedSearchResult) {
        return nestedSearchResult;
      }
    }

    // We did not find a match in any of the follow up questions for this question's options
    // now we must continue the search at the next top-level question

    const topLevelIndex = this.topLevelQuestionLabels.indexOf(
      firstSearchParentLabel,
    );

    if (topLevelIndex != -1) {
      // the initial parent question is a top-level question

      const nextTopLevelQuestionLabel =
        this.topLevelQuestionLabels?.[topLevelIndex + 1];

      if (!nextTopLevelQuestionLabel) {
        // we are on the last top-level question
        return null;
      }

      return this.find(questionPredicate, nextTopLevelQuestionLabel);
    }

    return null;
  }

  private getParentQuestion(
    questionLabel: string,
  ): SurveyQuestion | null | TrueImpactError {
    if (!this.questionBank.has(questionLabel)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `There is no question [${questionLabel}] in survey [${this.name}]`,
        ),
      ]);
    }

    const targetQuestion = this.find((q) => {
      if (!q.label) {
        throw new TrueImpactRuntimeException([
          new TrueImpactError(
            `Encountered a question without a label. This should not happen.`,
          ),
        ]);
      }

      return q.label === questionLabel;
    });

    if (!targetQuestion) {
      return null;
    }

    if (targetQuestion instanceof TrueImpactError) {
      return targetQuestion;
    }

    /**
     * TODO We will support this search via a dedicated query
     * database in the future. We can denormalize at this point to
     * optimize the queries (i.e., use doubly-linked nodes).
     */
    const parentQuestion = this.find((q) => {
      return Array.from(q.options.values()).some(
        (o: SurveyOption) => o.followUpQuestionLabel === targetQuestion.label,
      );
    });

    if (parentQuestion instanceof TrueImpactError) {
      return parentQuestion;
    }

    if (!parentQuestion) {
      return null;
    }

    return this.questionBank.get(parentQuestion?.label) || null;
  }

  /**
   * TODO Is this a view-layer concern?
   */
  getNextQuestionLabel(
    questionLabel: string,
    optionLabel: string,
  ): string | TrueImpactError | DONE {
    const question = this.questionBank.get(questionLabel) as SurveyQuestion;

    if (!question) {
      return new TrueImpactError(
        `There is no question [${questionLabel}] in survey [${this.name}]`,
      );
    }

    const option =
      question.get(optionLabel) ||
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `There is no option [${optionLabel}] for question [${questionLabel}] in survey [${this.name}]`,
        ),
      ]);

    if (option instanceof TrueImpactError) {
      return option;
    }

    const { followUpQuestionLabel } = option;

    /**
     * TODO If we allow multiple follow-up questions per option, we need to back-track to the parent not to top level
     */
    if (!followUpQuestionLabel) {
      // there are no follow-up questions, so we must back-track until we hit the top-level parent question (given that each option has at most 1 follow-up question)
      let parent: SurveyQuestion = question;

      while (
        parent !== null &&
        // We are looking for the top-level parent of the original question
        !this.topLevelQuestionLabels.includes(parent?.label)
      ) {
        const parentSearchResult = this.getParentQuestion(parent.label);

        if (parentSearchResult instanceof TrueImpactError) {
          return parentSearchResult;
        }

        if (parentSearchResult !== null) {
          parent = parentSearchResult;
        } else {
          // is there a better pattern?
          break;
        }
      }

      const topLevelIndexOfParent = this.topLevelQuestionLabels.indexOf(
        parent.label,
      );

      const nextLabel =
        this.topLevelQuestionLabels?.[topLevelIndexOfParent + 1];

      if (nextLabel) {
        return nextLabel;
      }

      return DONE;
    }

    return (
      this.questionBank.get(followUpQuestionLabel)?.label ||
      new TrueImpactError('oh no!')
    );
  }

  getNextQuestion(
    questionLabel: string,
    optionLabel: string,
  ): SurveyQuestion | null | TrueImpactError | DONE {
    const nextQuestionLabel = this.getNextQuestionLabel(
      questionLabel,
      optionLabel,
    );

    if (nextQuestionLabel instanceof TrueImpactError) {
      return nextQuestionLabel;
    }

    if (!nextQuestionLabel) {
      return null;
    }

    if (nextQuestionLabel === DONE) {
      return nextQuestionLabel;
    }

    return this.questionBank.get(nextQuestionLabel) || null;
  }

  @UpdateMethod()
  addOptionToQuestion(userRequest: {
    questionLabel: string;
    optionLabel: string;
    text: string;
  }): Survey | TrueImpactError {
    const { questionLabel } = userRequest;

    if (!this.questionBank.has(questionLabel)) {
      return new TrueImpactError(
        `You cannot add option [${userRequest.optionLabel}] to survey[${this.name}] as it has no question with the label [${userRequest.questionLabel}].`,
      );
    }

    const targetQuestion = this.questionBank.get(
      questionLabel,
    ) as SurveyQuestion;

    const updatedQuestion = targetQuestion.addOption(userRequest);

    if (updatedQuestion instanceof TrueImpactError) {
      return new TrueImpactError(
        `Failed to add option [${userRequest.optionLabel}] to survey[${this.name}].`,
        [updatedQuestion],
      );
    }

    this.questionBank.set(questionLabel, updatedQuestion);

    return this;
  }

  @UpdateMethod()
  addCategoryValueForOptionInQuestion({
    questionLabel,
    optionLabel,
    valuesByCategory,
  }: {
    questionLabel: string;
    optionLabel: string;
    valuesByCategory: Record<string, number>;
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
      weights: valuesByCategory,
    });

    if (updatedQuestion instanceof TrueImpactError) {
      return updatedQuestion;
    }

    this.questionBank.set(questionLabel, updatedQuestion);

    return this;
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
    if (this.questionBank.has(followUpQuestion.label)) {
      return new TrueImpactError(
        `You cannot add a follow-up question to option [${optionLabel}] for question [${questionLabel}] in survey [${this.name}] as there is already a question with the label [${followUpQuestion.label}]`,
      );
    }

    this.questionBank.set(
      followUpQuestion.label,
      SurveyQuestion.buildEmpty(followUpQuestion) as SurveyQuestion,
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
      return new TrueImpactError(
        `You cannot add follow-up question [${questionLabel}] to survey [${this.name}]`,
        [updatedQuestion],
      );
    }

    this.questionBank.set(questionLabel, updatedQuestion);

    return this;
  }

  // TODO move this to a `SurveyAnalyzer`
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

    this.questionBank.set(questionLabel, updatedQuestion);

    return this;
  }

  @UpdateMethod()
  publish(): this | TrueImpactError {
    if (this.isPublished) {
      new TrueImpactError(
        `You cannot publish survey [${this.name}], as it is already published`,
      );
    }

    this.isPublished = true;

    return this;
  }

  // fromUserRequest? // buildEmpty?
  static buildEmpty({
    name,
  }: {
    name: string;
  }): Survey | InvariantValidationError {
    const instance = new Survey({
      id: 'GENERATE_A_NEW_ID',
      isPublished: false,
      name,
      questions: {},
      revision: 0,
    });

    const result = instance.validateInvariants();

    return result;
  }

  static fromPersistenceDto({
    id,
    isPublished,
    name,
    questions,
    topLevelQuestionLabels: questionLabels,
    revision,
  }: SurveyPersistenceDto): Survey | TrueImpactError {
    const allQuestions = Object.entries(questions).map(
      ([label, questionDtoWithoutLabel]) =>
        SurveyQuestion.fromPersistenceDto({
          ...questionDtoWithoutLabel,
          label,
        }),
    );

    const questionBuildErrors = allQuestions.filter(
      (r): r is TrueImpactError => r instanceof TrueImpactError,
    );

    if (questionBuildErrors.length > 0) {
      return new InvariantValidationError(Survey, questionBuildErrors);
    }

    const survey = new Survey({
      id,
      revision,
      isPublished,
      name,
      questionLabels,
      questions: Object.fromEntries(
        allQuestions.map((q: SurveyQuestion): [string, SurveyQuestion] => [
          q.label,
          q,
        ]),
      ),
    });

    return survey.validateInvariants();
  }
}
