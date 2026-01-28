import { Entity, NonEmptyString, TrueImpactError } from 'src/libs';
import { SurveyQuestion } from './survey-question.entity';

export class Survey extends Entity {
  @NonEmptyString({
    label: 'ID',
    description: 'Unique identifier for this survey',
    isArray: false,
    isOptional: false,
  })
  id: string;

  // TODO support translations?
  name: string;

  /**
   * Each survey question option points to a next question (or null if it is a leaf).
   * In this way, the survey is directed graph. We should validate as part of the invariant validation
   * that it is acyclic.
   */
  firstQuestion: SurveyQuestion;

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

  setInitialId(generatedId: string): Survey | TrueImpactError {
    if (this.id !== 'GENERATE_A_NEW_ID') {
      return new TrueImpactError(
        `Cannot overwrite id: ${this.id} with generated ID: ${generatedId}`,
      );
    }

    this.id = generatedId;

    return this;
  }
}
