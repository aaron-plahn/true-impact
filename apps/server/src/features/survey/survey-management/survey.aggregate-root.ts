import {
  AggregateRoot,
  BooleanDataType,
  deepConvertMapToObject,
  InvariantValidationError,
  isPositiveNumber,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
  TrueImpactRuntimeException,
  UpdateMethod,
} from '../../../libs/data-types';
import { LookupTable } from '../../../libs/data-types/schema-management/decorators/lookup-table.decorator';
import { DONE, SURVEY_AGGREGATE_TYPE } from '../constants';
import {
  SurveyAnalyzer,
  SurveyAnalyzerPersistenceDto,
} from '../survey-analysis';
import { SurveyParticipantCompositeIdentifier } from '../survey-completion/models';
import { SurveyAccessToken } from './survey-access-token.entity';
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
  analyzers: Record<string, SurveyAnalyzerPersistenceDto>;
  accessTokensByHash: Record<string, SurveyAccessToken>;
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
    analyzers: {},
    accessTokensByHash: {},
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

  // TODO We need a draft \ publication \ versioning work-flow
  @BooleanDataType({
    label: 'is published',
    description: 'should this survey be available for completion?',
  })
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
  @NonEmptyString({
    label: 'top-level question labels',
    description:
      'an ordered list of the top-level (strictly required) questions, which may have additional follow up questions',
    isArray: true,
  })
  topLevelQuestionLabels: string[] = [];

  // We might want this in the future
  // defaultAnalyzerName?: string;

  analyzersByName: Map<string, SurveyAnalyzer> = new Map();

  @LookupTable(() => SurveyAccessToken, {
    label: 'access tokens by hash',
    description: 'provide access to a user',
  })
  accessTokensByHash: Map<string, SurveyAccessToken> = new Map();

  constructor({
    id,
    isPublished,
    name,
    questions,
    questionLabels,
    revision,
    analyzersByName,
    accessTokensByHash,
  }: {
    id: string;
    isPublished: boolean;
    name: string;
    revision?: number;
    questions?: Record<string, SurveyQuestion>;
    questionLabels?: string[];
    analyzersByName: Map<string, SurveyAnalyzer>;
    accessTokensByHash: Map<string, SurveyAccessToken>;
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

    this.analyzersByName = new Map(analyzersByName.entries());

    this.accessTokensByHash = new Map(accessTokensByHash.entries());
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

  hasAccessCode(hashedAccessCode: string): boolean {
    return this.accessTokensByHash.has(hashedAccessCode);
  }

  toPersistenceDto(): SurveyPersistenceDto {
    const analyzers = Object.fromEntries(
      Array.from(this.analyzersByName.entries()).map(
        ([analyzerName, analyzer]): [string, SurveyAnalyzerPersistenceDto] => [
          analyzerName,
          analyzer.toPersistenceDto(),
        ],
      ),
    );

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
      analyzers,
      accessTokensByHash: deepConvertMapToObject(this.accessTokensByHash),
    };

    return result;
  }

  getFirstQuestion(): SurveyQuestion | null {
    if (this.topLevelQuestionLabels.length === 0) {
      return null;
    }

    return this.questionBank.get(this.topLevelQuestionLabels[0]) || null;
  }

  has(questionLabel: string): boolean {
    return this.questionBank.has(questionLabel);
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
          `Survey [${this.name}] cannot be published, as a survey must have at least one question in order to be published`,
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
   *
   */
  validateComplexInvariants(): TrueImpactError[] {
    const allErrors = [...this.validatePublicationStatus()];

    const topLevelFollowUpQuestionErrors = Array.from(
      this.questionBank.values(),
    ).flatMap((q: SurveyQuestion) => {
      return Array.from(q.options.values()).flatMap((o: SurveyOption) => {
        if (
          o.followUpQuestionLabel &&
          this.topLevelQuestionLabels.includes(o.followUpQuestionLabel)
        ) {
          return [
            new TrueImpactError(
              `Survey [${this.name}] contains a loop: ${o.followUpQuestionLabel} -> ${o.label} -> ${o.followUpQuestionLabel}`,
            ),
          ];
        }

        return [];
      });
    });

    const seen = new Set<string>(this.topLevelQuestionLabels);

    /**
     * The weaker restriction is that a survey should have no loops. To avoid complex scenarios, we have decided
     * to require that any question appears at most once in a survey (i.e., the survey forms a tree).
     */
    Array.from(this.questionBank.values()).forEach((q) => {
      /**
       * It's ok for sibling options to have the same follow-up question.
       */
      const followUpQuestionLabelsForThisOption = new Set<string>();

      Array.from(q.options.values()).forEach((o) => {
        if (o.followUpQuestionLabel) {
          followUpQuestionLabelsForThisOption.add(o.followUpQuestionLabel);
        }
      });

      followUpQuestionLabelsForThisOption.forEach((ql) => {
        if (seen.has(ql)) {
          allErrors.push(
            new TrueImpactError(
              `Survey [${this.name}] has a repeated question [${ql}]`,
            ),
          );
        }

        seen.add(ql);
      });
    });

    allErrors.push(...topLevelFollowUpQuestionErrors);

    const missingQuestionErrors = this.topLevelQuestionLabels.flatMap(
      (questionLabel) =>
        this.has(questionLabel)
          ? []
          : [
              new TrueImpactError(
                `Survey [${this.name}] is missing question [${questionLabel}]`,
              ),
            ],
    );

    allErrors.push(...missingQuestionErrors);

    /**
     * TODO Can't we use the schema to ensure that nested entities automatically have their
     * `validateInvariants` called without needing to explicitly write this logic?
     */
    const analyzerErrors = Array.from(this.analyzersByName.values()).flatMap(
      (analyzer) => {
        const errorsForThisAnalyzer = analyzer.validateComplexInvariants();

        analyzer.valuesByQuestion.forEach((valuesByOption, questionLabel) => {
          if (!this.questionBank.has(questionLabel)) {
            errorsForThisAnalyzer.push(
              new TrueImpactError(
                `Encountered an invalid question [${questionLabel}] in analyzer [${analyzer.name}] for survey [${this.name}]. There is no such question in the survey.`,
              ),
            );
          } else {
            const targetQuestion = this.questionBank.get(
              questionLabel,
            ) as SurveyQuestion;

            valuesByOption.forEach((_valuesByCategory, optionLabel) => {
              if (!targetQuestion.has(optionLabel)) {
                errorsForThisAnalyzer.push(
                  new TrueImpactError(
                    `Encountered an invalid option [${optionLabel}] for question [${questionLabel}] in analyzer [${analyzer.name}] for survey [${this.name}]. The given question has no such option.`,
                  ),
                );
              }

              // TODO why not validate the categories while we are here?
            });
          }
        });

        return errorsForThisAnalyzer;
      },
    );

    allErrors.push(...analyzerErrors);

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

    return this.preventEditIfPublished();
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

    return this.preventEditIfPublished();
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

    return this.preventEditIfPublished();
  }

  @UpdateMethod()
  flagOption({
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
    // note that you are allowed to add flags after a survey is published as this doesn't affect survey completion. The participant is unaware of the flags.

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

    /**
     * Note that there is nothing that prevents you from modifying flags after a survey as published for use.
     */
    return this;
  }

  private preventEditIfPublished(): this | TrueImpactError {
    if (this.isPublished) {
      return new TrueImpactError(
        `You cannot edit Survey [${this.name}] as it has been published for public use.`,
      );
    }

    return this;
  }

  @UpdateMethod()
  publish(): this | TrueImpactError {
    if (this.isPublished) {
      return new TrueImpactError(
        `You cannot publish survey [${this.name}], as it has been published already.`,
      );
    }

    this.isPublished = true;

    return this;
  }

  /**
   * Survey Analysis Workflow
   */
  @UpdateMethod()
  createAnalyzer({ name }: { name: string }): Survey | TrueImpactError {
    if (this.analyzersByName.has(name)) {
      return new TrueImpactError(
        `You cannot add analyzer [${name}] to survey [${this.name}], as it already has an analyzer with this name.`,
      );
    }

    this.analyzersByName.set(name, SurveyAnalyzer.buildEmpty({ name }));

    return this;
  }

  @UpdateMethod()
  addCategoryForAnalyzer({
    analyzerName,
    category,
  }: {
    analyzerName: string;
    category: string;
  }): Survey | TrueImpactError {
    const targetAnalyzer = this.analyzersByName.get(analyzerName);

    const updatedAnalyzer =
      targetAnalyzer?.addCategory(category) ||
      new TrueImpactError(
        `You cannot add category [${category}] to analyzer [${analyzerName}] in survey [${this.name}], as there is no such analyzer in the target survey.`,
      );

    if (updatedAnalyzer instanceof TrueImpactError) {
      return new TrueImpactError(
        `Failed to add category [${category}] for analyzer [${analyzerName}] in survey [${this.name}]`,
        [updatedAnalyzer],
      );
    }

    this.analyzersByName.set(analyzerName, updatedAnalyzer);

    return this;
  }

  @UpdateMethod()
  addValueForOption({
    analyzerName,
    questionLabel,
    optionLabel,
    valuesByCategory,
  }: {
    analyzerName: string;
    questionLabel: string;
    optionLabel: string;
    valuesByCategory: Record<string, number>;
  }): this | TrueImpactError {
    const invalidValueErrors = Object.entries(valuesByCategory).flatMap(
      ([category, value]) =>
        // TODO this should **not** be a typeguard in itself
        !isPositiveNumber(value)
          ? [
              new TrueImpactError(
                `You cannot assign the value [${value as string}] to category [${category}]. All values must be positive integers.`,
              ),
            ]
          : [],
    );

    if (invalidValueErrors.length > 0) {
      return new TrueImpactError(
        `Failed to update values for for option [${optionLabel}] of question [${questionLabel}] in survey [${this.name}] (analyzer [${analyzerName}])`,
        invalidValueErrors,
      );
    }

    if (!this.has(questionLabel)) {
      // we can't go further
      return new TrueImpactError(
        `You cannot add values for question [${questionLabel}] in survey [${this.name}] (analyzer [${analyzerName}]), as there is no such question.`,
      );
    }

    if (!this.get(questionLabel)?.has(optionLabel)) {
      return new TrueImpactError(
        `You cannot add values for option [${optionLabel}] of question [${questionLabel}] in survey [${this.name} (analyzer [${analyzerName}])], as there is no such option`,
      );
    }

    if (!this.analyzersByName.has(analyzerName)) {
      return new TrueImpactError(
        `You cannot add values for option [${optionLabel}] of question [${questionLabel}] in survey [${this.name}], as the target analyzer [${analyzerName}] does not exist. Perhaps you forgot to create it?`,
      );
    }

    const targetAnalyzer = this.analyzersByName.get(
      analyzerName,
    ) as SurveyAnalyzer;

    const updatedAnalyzer = targetAnalyzer.addValuesForOption(
      questionLabel,
      optionLabel,
      valuesByCategory,
    );

    if (updatedAnalyzer instanceof TrueImpactError) {
      return new TrueImpactError(
        // Here we ensure the survey name is available to the user
        `Failed to add values for an option in survey [${this.name}] (analyzer [${analyzerName}])`,
        [updatedAnalyzer],
      );
    }

    this.analyzersByName.set(analyzerName, updatedAnalyzer);

    return this;
  }

  openToParticipant({
    dateOfExpiry,
    dateOpened,
    hash,
    participantCompositeIdentifier,
  }: {
    dateOpened: string;
    dateOfExpiry: string;
    hash: string;
    participantCompositeIdentifier: SurveyParticipantCompositeIdentifier;
  }) {
    const buildResult = SurveyAccessToken.openParticipantAccess({
      dateCreated: dateOpened,
      dateExpires: dateOfExpiry,
      hash,
      participantCompositeIdentifier,
      algorithm: 'TODO add me now!',
    });

    if (buildResult instanceof Error) {
      return buildResult;
    }

    this.accessTokensByHash.set(hash, buildResult);

    return this;
  }

  // TODO deal with dates consistently
  @UpdateMethod()
  openToAnonymousIndividual({
    dateOfExpiry,
    dateOpened,
    hash,
  }: {
    dateOpened: string;
    dateOfExpiry: string;
    hash: string;
  }): Survey | TrueImpactError {
    const buildResult = SurveyAccessToken.openAnonymousIndividualAccess({
      dateCreated: dateOpened,
      hash,
      algorithm: 'TODO add me',
      dateExpires: dateOfExpiry,
    });

    if (buildResult instanceof TrueImpactError) {
      return buildResult;
    }

    // TODO avoid collisions
    this.accessTokensByHash.set(hash, buildResult);

    return this;
  }

  @UpdateMethod()
  revokeAccessdCode(hashedAccessCode: string): Survey | TrueImpactError {
    if (!this.accessTokensByHash.has(hashedAccessCode)) {
      return new TrueImpactError('Failed to revoke unknown access code.');
    }

    this.accessTokensByHash.delete(hashedAccessCode);

    return this;
  }

  static buildEmpty({
    name,
    id,
  }: {
    id: string;
    name: string;
  }): Survey | InvariantValidationError {
    const instance = new Survey({
      id,
      isPublished: false,
      name,
      questions: {},
      revision: 0,
      analyzersByName: new Map(),
      accessTokensByHash: new Map(),
    });

    const result = instance.validateInvariants();

    return result;
  }

  static fromPersistenceDto(
    {
      id,
      isPublished,
      name,
      questions,
      topLevelQuestionLabels: questionLabels,
      revision,
      analyzers,
      accessTokensByHash,
    }: SurveyPersistenceDto,
    buildOptions: { shouldValidate?: boolean } = {},
  ): Survey | TrueImpactError {
    const allQuestions = Object.entries(questions).map(
      ([label, questionDtoWithoutLabel]) =>
        SurveyQuestion.fromPersistenceDto(
          {
            ...questionDtoWithoutLabel,
            label,
          },
          buildOptions,
        ),
    );

    const questionBuildErrors = allQuestions.filter(
      (r): r is TrueImpactError => r instanceof TrueImpactError,
    );

    if (questionBuildErrors.length > 0) {
      return new InvariantValidationError(Survey, name, questionBuildErrors);
    }

    const analyzersBuildResult = new Map<string, SurveyAnalyzer>();

    const analyzerInvariantErrors: TrueImpactError[] = [];

    Object.entries(analyzers).forEach(([analyzerName, analyzerDto]) => {
      const buildResult = SurveyAnalyzer.fromPersistenceDto(
        {
          // TODO remove name from the lookup table DTO as it's redundant
          ...analyzerDto,
          name: analyzerName,
        },
        buildOptions,
      );

      if (buildResult instanceof TrueImpactError) {
        analyzerInvariantErrors.push(buildResult);

        return;
      }

      analyzersBuildResult.set(analyzerName, buildResult);
    });

    if (analyzerInvariantErrors.length > 0) {
      return new InvariantValidationError(
        Survey,
        name,
        analyzerInvariantErrors,
      );
    }

    const accessTokenBuildResult = new Map<string, SurveyAccessToken>();

    const accessTokenBuildErrors: TrueImpactError[] = [];

    Object.entries(accessTokensByHash).forEach(([_, value]) => {
      const buildResult = SurveyAccessToken.fromPersistenceDto(value);

      accessTokenBuildResult.set(buildResult.hash, buildResult);
    });

    if (accessTokenBuildErrors.length > 0) {
      return new InvariantValidationError(Survey, name, accessTokenBuildErrors);
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
      analyzersByName: analyzersBuildResult,
      accessTokensByHash: accessTokenBuildResult,
    });

    if (buildOptions.shouldValidate) {
      return survey.validateInvariants();
    }

    return survey;
  }
}
