import {
  Entity,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactError,
} from '../../../../libs/data-types';

export class SurveyAnalysisCategoryPersistenceDto {
  number: number;
  label: string;
}

/**
 * We need to determine how this is different from a set of categories used
 * to group questions.
 *
 * For survey analysis categories, you can assign a numeric value for each question option.
 */
export class SurveyAnalysisCategory extends Entity {
  @NonNegativeInteger({
    label: 'category number',
    // this allows relabelling a category without losing its assigned question values
    description:
      'uniquely identifies this category within the context of a given survey',
  })
  number: number;

  @NonEmptyString({
    label: 'label',
    description: 'the label for this category',
  })
  label: string;

  // TODO language code

  constructor({ number, label }: { number: number; label: string }) {
    super();

    this.number = number;

    this.label = label;
  }

  validateComplexInvariants(): TrueImpactError[] {
    throw new Error('Method not implemented.');
  }

  getId(): string {
    return this.number.toString();
  }

  getName(): string {
    return this.label;
  }

  toPersistenceDto(): SurveyAnalysisCategoryPersistenceDto {
    return {
      number: this.number,
      label: this.label,
    };
  }

  static fromPersistenceDto(
    { number, label }: SurveyAnalysisCategoryPersistenceDto,
    _shouldValidate?: boolean,
  ): Entity | TrueImpactError {
    return new SurveyAnalysisCategory({
      number,
      label,
    });
  }
}
