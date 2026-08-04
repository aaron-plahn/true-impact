import {
  deepConvertMapToObject,
  DeepMapToRecord,
  Entity,
  InvariantValidationError,
  isPositiveNumber,
  NonEmptyString,
  TrueImpactError,
  UpdateMethod,
} from '../../../../libs/data-types';
import { LookupTable } from '../../../../libs/data-types/schema-management/decorators/lookup-table.decorator';
import {
  SurveyAnalysisCategory,
  SurveyAnalysisCategoryPersistenceDto,
} from './survey-analysis-category';

type CategoryLabel = string;
type QuestionLabel = string;
type OptionLabel = string;

type ValuesByQuestion = Map<
  QuestionLabel,
  Map<OptionLabel, Map<CategoryLabel, number>>
>;

type RawValuesByQuestion = DeepMapToRecord<ValuesByQuestion>;

export class SurveyAnalyzerPersistenceDto {
  name: string;

  categories: Record<CategoryLabel, SurveyAnalysisCategoryPersistenceDto>;

  valuesByQuestion: RawValuesByQuestion;
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

  /**
   * We use a nested entity here because we may want to also have a `description` for each category.
   * However, there's also a chance that these categories will become aggregate roots in their own right at some
   * point so they can be shared across surveys.
   *
   * We use a map to ensure category labels are unique by design.
   */
  @LookupTable(() => SurveyAnalysisCategory, {
    label: 'categories by label',
    description: 'a lookup table of categories organized by their labels',
  })
  categoriesByLabel: Map<CategoryLabel, SurveyAnalysisCategory>;

  @LookupTable('number', {
    label: 'values by question',
    description: `a lookup table of numeric values for each question, option, and category`,
  })
  valuesByQuestion: ValuesByQuestion;

  constructor({
    name,
    categories = new Map(),
    valuesByQuestion,
  }: {
    name: string;
    categories?: Map<CategoryLabel, SurveyAnalysisCategory>;
    valuesByQuestion: ValuesByQuestion;
  }) {
    super();

    this.name = name;

    this.categoriesByLabel = categories;

    this.valuesByQuestion = valuesByQuestion;
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    Array.from(this.valuesByQuestion.entries()).forEach(
      ([questionLabel, valuesByOption]) => {
        // we validate the questionLabel against the survey's questions at a higher level

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

                if (!this.categoriesByLabel.has(categoryLabel)) {
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
  addCategory(category: string): SurveyAnalyzer | TrueImpactError {
    if (this.categoriesByLabel.has(category)) {
      return new TrueImpactError(
        `You cannot add category [${category}] to analyzer [${this.name}], as it already has the given category.`,
      );
    }

    const newCategory = SurveyAnalysisCategory.fromPersistenceDto(
      {
        label: category,
      },
      { shouldValidate: true },
    );

    if (newCategory instanceof TrueImpactError) {
      return new TrueImpactError(
        `Failed to add category [${category}] to analyzer [${this.name}]. The provided category is invalid.`,
        [newCategory],
      );
    }

    this.categoriesByLabel.set(category, newCategory);

    return this;
  }

  @UpdateMethod()
  addValuesForOption(
    questionLabel: string,
    optionLabel: string,
    values: Record<string, number>,
  ): SurveyAnalyzer | TrueImpactError {
    const missingCategoryErrors = Object.entries(values).flatMap(
      ([categoryLabel, value]) =>
        !this.categoriesByLabel.has(categoryLabel)
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
      this.valuesByQuestion.get(questionLabel) ||
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

    if (!this.valuesByQuestion.has(questionLabel)) {
      // This is the first value for an option in this question
      this.valuesByQuestion.set(questionLabel, new Map());
    }

    this.valuesByQuestion
      .get(questionLabel)
      ?.set(optionLabel, valuesByCategory);

    return this;
  }

  getId(): string {
    // the name is unique amongst all analyzers for this survey and serves as a local identifier within the context of the parent survey
    return this.getName();
  }

  getName(): string {
    return this.name;
  }

  hasCategory(category: string) {
    return this.categoriesByLabel.has(category);
  }

  countCategories(): number {
    return this.categoriesByLabel.size;
  }

  getAllValuesForOption({
    questionLabel,
    optionLabel,
  }: {
    questionLabel: string;
    optionLabel: string;
  }): Map<string, number> {
    const searchResult = this.valuesByQuestion
      .get(questionLabel)
      ?.get(optionLabel);

    return searchResult || new Map<string, number>();
  }

  getValueFor({
    questionLabel,
    optionLabel,
    category,
  }: {
    questionLabel: string;
    optionLabel: string;
    category: string;
  }): number | undefined {
    return (
      this.valuesByQuestion
        .get(questionLabel)
        ?.get(optionLabel)
        ?.get(category) || undefined
    );
  }

  toPersistenceDto(): SurveyAnalyzerPersistenceDto {
    return {
      name: this.name,
      categories: deepConvertMapToObject(this.categoriesByLabel),
      valuesByQuestion: deepConvertMapToObject(this.valuesByQuestion),
    };
  }

  static buildEmpty({ name }: { name: string }) {
    return new SurveyAnalyzer({
      name,
      valuesByQuestion: new Map(),
    });
  }

  static fromPersistenceDto(
    {
      name,
      categories,
      valuesByQuestion: rawValues,
    }: SurveyAnalyzerPersistenceDto,
    buildOptions: { shouldValidate?: boolean } = {},
  ): SurveyAnalyzer | TrueImpactError {
    const categoryBuildErrors: TrueImpactError[] = [];

    const categoryBuildResults = new Map<
      CategoryLabel,
      SurveyAnalysisCategory
    >();

    Object.entries(categories).forEach(([categoryLabel, categoryDto]) => {
      const buildResult = SurveyAnalysisCategory.fromPersistenceDto(
        categoryDto,
        buildOptions,
      );

      if (buildResult instanceof TrueImpactError) {
        categoryBuildErrors.push(buildResult);
      } else {
        categoryBuildResults.set(categoryLabel, buildResult);
      }
    });

    if (categoryBuildErrors.length > 0) {
      return new InvariantValidationError(
        SurveyAnalyzer,
        name,
        categoryBuildErrors,
      );
    }

    const valuesByQuestion: ValuesByQuestion = new Map();

    Object.entries(rawValues).forEach(
      ([questionLabel, rawValuesByQuestion]) => {
        valuesByQuestion.set(questionLabel, new Map());

        Object.entries(rawValuesByQuestion).forEach(
          ([optionLabel, valuesByCategory]) => {
            valuesByQuestion.get(questionLabel)?.set(optionLabel, new Map());

            Object.entries(valuesByCategory).forEach(([category, value]) => {
              valuesByQuestion
                .get(questionLabel)
                ?.get(optionLabel)
                ?.set(category, value);
            });
          },
        );
      },
    );

    const instance = new SurveyAnalyzer({
      name,
      categories: categoryBuildResults,
      valuesByQuestion: valuesByQuestion,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
