import {
  Entity,
  InvariantValidationError,
  isPositiveNumber,
  NonEmptyString,
  TrueImpactError,
  UpdateMethod,
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
    categories?: SurveyAnalysisCategory[];
    values: SurveyOptionValueTracker;
  }) {
    super();

    this.name = name;

    if (categories) {
      this.categories = categories;
    } else {
      this.categories = [];
    }

    this.values = values;
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    Array.from(this.values.valuesByQuestion.entries()).forEach(
      ([questionLabel, valuesByOption]) => {
        // we have to validate the questionLabel against the survey's questions at a higher level

        const knownCategoryLabels = new Set(
          this.categories.map(({ label }) => label),
        );

        Array.from(valuesByOption.entries()).forEach(
          ([optionLabel, valuesByOptionLabel]) => {
            Array.from(valuesByOptionLabel.entries()).forEach(
              ([categoryLabel, value]) => {
                if (!isPositiveNumber(value)) {
                  allErrors.push(
                    new TrueImpactError(
                      `Invalid value [${value as unknown as string}] assigned to category [${categoryLabel}] for option [${optionLabel}] of question [${questionLabel}]. Expected a positive integer.`,
                    ),
                  );
                }

                if (!knownCategoryLabels.has(categoryLabel)) {
                  allErrors.push(
                    new TrueImpactError(
                      `Encountered an unknown category [${categoryLabel}] (value [${value}]) for question [${questionLabel}] \\ option [${optionLabel}]`,
                    ),
                  );
                }
              },
            );
          },
        );
      },
    );

    return allErrors;
  }

  @UpdateMethod()
  addValuesForOption(
    questionLabel: string,
    optionLabel: string,
    values: Record<string, number>,
  ): SurveyAnalyzer | TrueImpactError {
    const missingCategoryErrors = Object.entries(values).flatMap(
      ([categoryLabel, value]) =>
        !this.categories.some((c) => c.label === categoryLabel)
          ? new TrueImpactError(
              `You cannot add value [${value}] for category [${categoryLabel}], as there is no such category.`,
            )
          : [],
    );

    if (missingCategoryErrors.length > 0) {
      return new TrueImpactError(
        `Failed to add values for option [${optionLabel}] of question [${questionLabel}]`,
        missingCategoryErrors,
      );
    }

    const valuesByOption =
      this.values.valuesByQuestion.get(questionLabel) ||
      new Map<string, Map<string, number>>();

    const valuesByCategory =
      valuesByOption.get(optionLabel) || new Map<string, number>();

    /**
     * TODO We may want to allow this in the future. We'll need to see
     * what the workflow looks like in the UX in practice.
     */
    const failedOverwriteErrors: TrueImpactError[] = Object.entries(
      values,
    ).flatMap(([category, newValue]) => {
      if (valuesByCategory.has(category)) {
        return [
          new TrueImpactError(
            `You cannot overwrite the value [${valuesByCategory.get(category)}] of category [${category}] with the new value [${newValue}]`,
          ),
        ];
      }

      return [];
    });

    if (failedOverwriteErrors.length > 0) {
      return new TrueImpactError(
        `Failed to add one or more values to option [${optionLabel}] of question [${questionLabel}]`,
        failedOverwriteErrors,
      );
    }

    Object.entries(values).forEach(([k, v]) => {
      valuesByCategory.set(k, v);
    });

    this.values.valuesByQuestion
      .get(questionLabel)
      ?.set(optionLabel, valuesByCategory);

    return this;
  }

  getId(): string {
    // the name is unique amongst all analyzers for this survey
    return this.getName();
  }

  getName(): string {
    return this.name;
  }

  getValueFor(
    questionLabel: string,
    optionLabel: string,
    category: string,
  ): number | undefined {
    return (
      this.values.valuesByQuestion
        .get(questionLabel)
        ?.get(optionLabel)
        ?.get(category) || undefined
    );
  }

  toPersistenceDto(): SurveyAnalyzerPersistenceDto {
    return {
      name: this.name,
      categories: this.categories.map((c) => c.toPersistenceDto()),
      values: this.values.toPersistenceDto(),
    };
  }

  static buildEmpty({ name }: { name: string }) {
    return new SurveyAnalyzer({
      name,
      values: SurveyOptionValueTracker.buildEmpty(),
    });
  }

  static fromPersistenceDto(
    { name, categories, values }: SurveyAnalyzerPersistenceDto,
    shouldValidate?: boolean,
  ): SurveyAnalyzer | TrueImpactError {
    const categoryBuildResults = categories.map((c) =>
      SurveyAnalysisCategory.fromPersistenceDto(c, shouldValidate),
    );

    const failures = categoryBuildResults.filter(
      (r): r is TrueImpactError => r instanceof TrueImpactError,
    );

    if (failures.length > 0) {
      return new InvariantValidationError(SurveyAnalyzer, name, failures);
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
