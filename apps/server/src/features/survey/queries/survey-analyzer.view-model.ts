import {
  deepConvertMapToObject,
  NonEmptyString,
} from '../../../libs/data-types';
import { LookupTable } from '../../../libs/data-types/schema-management/decorators/lookup-table.decorator';
import { SurveyAnalyzer } from '../survey-analysis';

type QuestionLabel = string;

type OptionLabel = string;

type Category = string;

type ValueForOption = number;

export class SurveyAnalyzerViewModelClientDto {
  @NonEmptyString({
    label: 'name',
    description: 'name of this analysis approach',
  })
  name: string;

  @NonEmptyString({
    label: 'categories',
    description:
      'a list of the categories that can be used to analyze this survey',
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  categories: Category[];

  @LookupTable('number', {
    depth: 3,
    label: 'values by category, by option, by question',
    description:
      'a lookup table with values for one or more analysis categories for this option of the given question',
  })
  valuesByOptionByQuestion: Record<
    QuestionLabel,
    Record<OptionLabel, Record<Category, ValueForOption>>
  >;
}

type SurveyAnalysisValueLookupTable = Map<
  QuestionLabel,
  Map<OptionLabel, Map<Category, ValueForOption>>
>;

export class SurveyAnalyzerViewModel {
  name: string;

  categories: Category[];

  valuesByOptionByQuestion: SurveyAnalysisValueLookupTable;

  constructor({
    name,
    categories,
    valuesByOptionByQuestion,
  }: {
    name: string;
    categories: string[];
    valuesByOptionByQuestion: SurveyAnalysisValueLookupTable;
  }) {
    this.name = name;

    this.categories = [...categories];

    this.valuesByOptionByQuestion = valuesByOptionByQuestion;
  }

  toClientDto(): SurveyAnalyzerViewModelClientDto {
    return {
      name: this.name,
      categories: this.categories,
      valuesByOptionByQuestion: deepConvertMapToObject(
        this.valuesByOptionByQuestion,
      ),
    };
  }

  static fromDomainModel(domainModel: SurveyAnalyzer): SurveyAnalyzerViewModel {
    const { name, categoriesByLabel, valuesByQuestion: values } = domainModel;

    const categories = Array.from(categoriesByLabel.keys());

    return new SurveyAnalyzerViewModel({
      name,
      categories, // in the future, this may be a `Record<string,CategoryViewModel>`
      valuesByOptionByQuestion: values,
    });
  }
}
