import { deepConvertMapToObject } from '../../../../libs/data-types';

// We may want to do something like this in order to generate default report presentation on the client \ as PDFs.
// export class SurveyReportCategory {
//   // multilingual text?
//   label: string;
//   // description?
//   color: 'red' | 'white' | 'yellow' | 'black' | 'blue' | 'green';
// }

export class SurveyReportViewModelClientDto {
  // TODO decorators
  name: string;

  categories: string[];

  valuesByCategory: Record<string, number>;

  timeSubmitted?: number;
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

  // unix time-stamp
  timeSubmitted?: number;

  constructor({
    name,
    categories,
    timeSubmitted,
  }: {
    name: string;
    categories: string[];
    timeSubmitted?: number;
  }) {
    this.name = name;

    this.categories = categories;

    this.timeSubmitted = timeSubmitted;

    // Note that we currently use a builder pattern to set values. But this might shift when we go to event sourcing our views.

    // We initialize all category values to 0 so that zero-valued categories still appear in reports.
    categories.forEach((category) => {
      this.valuesByCategory.set(category, 0);
    });
  }

  toClientDto(): SurveyReportViewModelClientDto {
    return {
      name: this.name,
      categories: this.categories,
      valuesByCategory: deepConvertMapToObject(this.valuesByCategory),
      timeSubmitted: this.timeSubmitted,
    };
  }

  add(category: string, value: number): SurveyReportViewModel {
    this.valuesByCategory.set(
      category,
      // The or is to satisfy TS. We have initialized all values to 0 to start with.
      (this.valuesByCategory.get(category) || 0) + value,
    );

    return this;
  }
}
