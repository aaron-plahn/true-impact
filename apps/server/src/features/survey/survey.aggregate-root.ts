import { NotImplementedException } from '@nestjs/common';
import {
  AggregateRoot,
  InvariantValidationError,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs/data-types';
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
  questionLabels: string[];
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
    questionLabels: [],
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

  // TODO support translations?
  // @Unique
  @NonEmptyString({
    label: 'Name',
    description: 'the name of this survey to display in lists',
    mustBeUnique: true,
  })
  name: string;

  // @NonNegativeInteger({
  //   label: 'revision',
  //   description:
  //     'an increasing sequence number that reflects the current version of this survey',
  // })
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
  questionLabels: string[] = [];

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
      this.questionLabels = [...questionLabels];
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
      questionLabels: this.questionLabels,
      revision: this.revision,
    };

    return result;
  }

  getFirstQuestion(): SurveyQuestion | null {
    if (this.questionLabels.length === 0) {
      return null;
    }

    return this.questionBank.get(this.questionLabels[0]) || null;
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
   */
  validateComplexInvariants(): TrueImpactError[] {
    return [...this.validatePublicationStatus()];
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

    this.questionLabels.push(questionBuildResult.label);

    return this;
  }

  getNextQuestionLabel(_questionLabel: string, _optionLabel: string): string {
    throw new NotImplementedException();
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
    questionLabels,
    revision,
  }: SurveyPersistenceDto): Survey | TrueImpactError {
    const survey = new Survey({
      id,
      revision,
      isPublished,
      name,
      questionLabels,
      questions: Object.entries(questions).reduce(
        (acc: Record<string, SurveyQuestion>, [label, questionDto]) => {
          acc[label] = SurveyQuestion.fromPersistenceDto(questionDto);

          return acc;
        },
        {},
      ),
    });

    return survey.validateInvariants();
  }
}
