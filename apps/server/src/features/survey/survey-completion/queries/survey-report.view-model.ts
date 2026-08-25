import { deepConvertMapToObject } from '../../../../libs/data-types';

export class SurveyReportCategory {
  // multilingual text?
  label: string;
  // description?
  color: 'red' | 'white' | 'yellow' | 'black' | 'blue' | 'green';
}

export class SurveyReportViewModelClientDto {
  name: string;

  categories: string[];

  valuesByCategory: Record<string, number>;
}

export class SurveyReportViewModel {
  // TODO ML Text
  name: string;

  // TODO ML Text?
  /**
   * These are the keys in `valuesByCategory`
   */
  categories: string[];

  /**
   * We may generalize this at some point
   */
  valuesByCategory = new Map<string, number>();

  constructor({ name, categories }: { name: string; categories: string[] }) {
    this.name = name;

    this.categories = categories;

    // Note that we currently use a builder pattern to set values. But this might shift when we go to event sourcing our views.
  }

  toClientDto(): SurveyReportViewModelClientDto {
    return {
      name: this.name,
      categories: this.categories,
      valuesByCategory: deepConvertMapToObject(this.valuesByCategory),
    };
  }

  add(category: string, value: number): SurveyReportViewModel {
    this.valuesByCategory.set(
      category,
      // Do we want to initialize all values to zero to start with?
      (this.valuesByCategory.get(category) || 0) + value,
    );

    return this;
  }
}
