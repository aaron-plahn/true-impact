import {
  Entity,
  NonEmptyString,
  TrueImpactError,
} from '../../../../libs/data-types';

export class SurveyAnalysisCategoryPersistenceDto {
  label: string;
}

/**
 * We need to determine how this is different from a set of categories used
 * to group questions.
 *
 * For survey analysis categories, you can assign a numeric value for each question option.
 */
export class SurveyAnalysisCategory extends Entity {
  @NonEmptyString({
    label: 'label',
    description: 'the label for this category',
  })
  label: string;

  // TODO language code

  constructor({ label }: { label: string }) {
    super();

    this.label = label;
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.label;
  }

  getName(): string {
    return this.label;
  }

  toPersistenceDto(): SurveyAnalysisCategoryPersistenceDto {
    return {
      label: this.label,
    };
  }

  static fromPersistenceDto(
    { label }: SurveyAnalysisCategoryPersistenceDto,
    buildOptions: { shouldValidate?: boolean } = {},
  ): SurveyAnalysisCategory | TrueImpactError {
    const instance = new SurveyAnalysisCategory({
      label,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
