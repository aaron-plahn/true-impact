import { deepConvertMapToObject, NonEmptyString } from 'src/libs/data-types';
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

  // TODO @LookupTable
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

  static fromDomainModel({
    name,
    categories,
    values,
  }: SurveyAnalyzer): SurveyAnalyzerViewModel {
    return new SurveyAnalyzerViewModel({
      name,
      categories: categories.map(({ label }) => label),
      valuesByOptionByQuestion: values.valuesByQuestion,
    });
  }
}
