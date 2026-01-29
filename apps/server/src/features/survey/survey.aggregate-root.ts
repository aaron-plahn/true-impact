import {
  Entity,
  InvariantValidationError,
  isNonEmptyString,
  NonEmptyString,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../libs';
import { AddQuestionToSurvey } from './commands/add-question-to-survey.command';
import { CreateSurvey } from './commands/create-survey.command';
import {
  SurveyQuestion,
  SurveyQuestionPersistenceDto,
} from './survey-question.entity';

export class SurveyPersistenceDto {
  id: string;
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
    name: 'test survey',
    questions: {},
    // firstQuestionLabel:
  },
})
export class Survey extends Entity {
  @NonEmptyString({
    label: 'ID',
    description: 'Unique identifier for this survey',
    isArray: false,
    isOptional: false,
  })
  id: string;

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
   * If `firstQuestion` is null, it is not possible to publish the survey.
   */
  firstQuestion: SurveyQuestion | null;

  constructor({
    id,
    name,
    questions,
  }: {
    id: string;
    name: string;
    questions?: Record<string, SurveyQuestion>;
  }) {
    super();

    this.id = isNonEmptyString(id) ? id : 'GENERATE_A_NEW_ID';

    this.name = name;

    this.questions = new Map(Object.entries(questions || {}));
  }

  /**
   * - A Survey can not be published if it has no `firstQuestion`.
   * - A Survey must constitute an acyclic graph via its questions. That is, no `SurveyOption.next` should point to a previous
   * question in the survey.
   * - A published survey's questions must offer at least 2 options each
   */
  validateComplexInvariants(): TrueImpactError[] {
    return [];
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
    };

    return result;
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
  addQuestion(userRequest: AddQuestionToSurvey): Survey | TrueImpactError {
    if (this.questions.has(userRequest.label)) {
      return new TrueImpactError(
        `You cannot add question [${userRequest.label}] to survey [${this.name}], as there is already a question with that label.`,
      );
    }

    const questionBuildResult =
      SurveyQuestion.fromAddQuestionToSurvey(userRequest);

    if (questionBuildResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([questionBuildResult]);
    }

    this.questions.set(questionBuildResult.label, questionBuildResult);

    return this;
  }

  static fromPersistenceDto({
    id,
    name,
    questions,
  }: SurveyPersistenceDto): Survey | TrueImpactError {
    return new Survey({
      id,
      name,
      questions: Object.entries(questions).reduce(
        (acc: Record<string, SurveyQuestion>, [label, questionDto]) => {
          acc[label] = SurveyQuestion.fromPersistenceDto(questionDto);

          return acc;
        },
        {},
      ),
    });
  }

  static fromCreateSurveyCommand({
    name,
  }: CreateSurvey): Survey | InvariantValidationError {
    const instance = new Survey({
      id: 'GENERATE_A_NEW_ID',
      name,
      questions: {},
    });

    return instance.validateInvariants();
  }
}
