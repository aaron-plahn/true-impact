import {
  deepConvertMapToObject,
  LookupTable,
  NonEmptyString,
  NonNegativeInteger,
} from '../../../../libs/data-types';

// We may want to do something like this in order to generate default report presentation on the client \ as PDFs.
// export class SurveyReportCategory {
//   // multilingual text?
//   label: string;
//   // description?
//   color: 'red' | 'white' | 'yellow' | 'black' | 'blue' | 'green';
// }

export class SurveyReportViewModelClientDto {
  @NonEmptyString({
    label: 'name',
    description: 'name of the report',
  })
  name: string;

  @NonEmptyString({
    label: 'categories',
    description: 'list of categories for this report',
    isArray: true,
    // can this really be empty?
    isOptional: true, //i.e., may be empty
  })
  categories: string[];

  @LookupTable('number', {
    label: 'values by category',
    description:
      'cumulative (across responses to all questions) values for each category in this report',
  })
  valuesByCategory: Record<string, number>;

  @NonNegativeInteger({
    label: 'submission time',
    description: 'date and time at which the participant submitted this survey',
    isOptional: true, // omitted if still in progress
  })
  submissionTime?: number;
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
  submissionTime?: number;

  constructor({
    name,
    categories,
    submissionTime,
  }: {
    name: string;
    categories: string[];
    submissionTime?: number;
  }) {
    this.name = name;

    this.categories = categories;

    this.submissionTime = submissionTime;

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
      submissionTime: this.submissionTime,
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
