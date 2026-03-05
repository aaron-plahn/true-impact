import {
  Entity,
  InvariantValidationError,
  NonEmptyString,
  TrueImpactError,
} from '../../../../libs/data-types';
import {
  SurveyAnalysisCategory,
  SurveyAnalysisCategoryPersistenceDto,
} from './survey-analysis-category';
import {
  SurveyOptionValueTracker,
  SurveyOptionValueTrackerPersistenceDto,
} from './survey-option-value-tracker';

export class SurveyAnalyzerPersistenceDto {
  name: string;

  categories: SurveyAnalysisCategoryPersistenceDto[];

  values: SurveyOptionValueTrackerPersistenceDto;
}

/**
 * One survey can have many analyzers. This allows us to
 * - freely create different analysis algorithms for an existing survey without affecting the current results
 * - do A \ B testing on different approaches to analyzing a survey
 * - Allow for the same survey to be analyzed using multiple approaches for multiple purposes
 */
export class SurveyAnalyzer extends Entity {
  // do we want a sequence number to allow renaming?
  @NonEmptyString({
    label: 'name',
    description:
      'name of this analysis approach (unique amongst all analyzers for the given survey)',
  })
  name: string;

  // TODO Do we want a `Map` or maybe `Set` here instead?
  categories: SurveyAnalysisCategory[];

  values: SurveyOptionValueTracker;

  constructor({
    name,
    categories,
    values,
  }: {
    name: string;
    categories: SurveyAnalysisCategory[];
    values: SurveyOptionValueTracker;
  }) {
    super();

    this.name = name;

    this.categories = categories;

    this.values = values;
  }

  validateComplexInvariants(): TrueImpactError[] {
    throw new Error('Method not implemented.');
  }

  getId(): string {
    // the name is unique amongst all analyzers for this survey
    return this.getName();
  }

  getName(): string {
    return this.name;
  }

  toPersistenceDto(): SurveyAnalyzerPersistenceDto {
    return {
      name: this.name,
      categories: this.categories.map((c) => c.toPersistenceDto()),
      values: this.values.toPersistenceDto(),
    };
  }

  static fromPersistenceDto(
    { name, categories, values }: SurveyAnalyzerPersistenceDto,
    shouldValidate?: boolean,
  ): Entity | TrueImpactError {
    const categoryBuildResults = categories.map((c) =>
      SurveyAnalysisCategory.fromPersistenceDto(c, shouldValidate),
    );

    const failures = categoryBuildResults.filter(
      (r): r is TrueImpactError => r instanceof TrueImpactError,
    );

    if (failures.length > 0) {
      return new InvariantValidationError(SurveyAnalyzer, failures);
    }

    const valuesBuildResult =
      SurveyOptionValueTracker.fromPersistenceDto(values);

    if (valuesBuildResult instanceof TrueImpactError) {
      return valuesBuildResult;
    }

    return new SurveyAnalyzer({
      name,
      categories: categoryBuildResults as SurveyAnalysisCategory[],
      values: valuesBuildResult,
    });
  }
}
