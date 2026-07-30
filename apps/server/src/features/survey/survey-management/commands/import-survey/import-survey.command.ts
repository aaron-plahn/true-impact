import {
  LookupTable,
  NestedDataType,
  NonEmptyString,
  RawObject,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';

class MultilingualTextDto {
  @NonEmptyString({
    label: 'text',
    description: 'plain text in the given language',
  })
  text: string;
  // languageCode
}

@TrueImpactDataExample<SurveyAnalyzerImportDto>({
  example: {
    name: {
      text: '4 learning styles',
    },
    categories: [],
  },
})
export class SurveyAnalyzerImportDto {
  @NestedDataType(() => MultilingualTextDto, {
    label: 'name',
    description: 'name of this analyzer',
  })
  name: MultilingualTextDto;

  @NonEmptyString({
    label: 'categories',
    description: 'available categories (parameters) for survey analysis',
    isArray: true,
  })
  categories: string[];
}

export class SurveyQuestionImportDto {
  @NonEmptyString({
    label: 'label',
    description: 'label ("question number")',
  })
  label: string;

  @NonEmptyString({
    label: 'label',
    description: 'prompt for this question',
  })
  prompt: string;

  @NestedDataType(() => SurveyOptionImportDto, {
    label: 'options',
    description: 'list of options available to the user',
    isArray: true,
    isOptional: true, // can be empty
  })
  options: SurveyOptionImportDto[];
}

export class SurveyOptionImportDto {
  @NonEmptyString({
    label: 'label',
    description: 'user-facing label for this option',
  })
  label: string;

  @NonEmptyString({
    label: 'text',
    description: 'text for this option',
  })
  text: string;

  /**
   * Currently, our data-types lib does not support recursive types.
   * Follow-up questions must be validated manually.
   *
   * TODO do this!
   */
  @RawObject({
    label: 'follow-up question',
    description: 'Question to be asked in case the user selects this option',
    isOptional: true,
  })
  // TODO spelling? followupQuestion?
  followUpQuestion?: SurveyQuestionImportDto;

  @NonEmptyString({
    label: 'flags',
    description: 'a list of flags to apply to this option',
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  /**
   * These will either be created or looked up if existing.
   */
  flags: string[];

  @LookupTable('number', {
    label: 'values by analyzer name',
    description:
      'for each analyzer in this survey, for each category of the analyzer, what value does this option introduce?',
    depth: 2,
  })
  valuesByAnalyzerName: Record<string, Record<string, number>>;
}

@TrueImpactDataExample<ImportSurvey>({
  example: {
    name: {
      text: 'Default Test Survey',
    },
    questions: [],
    analyzers: [],
  },
})
export class ImportSurvey {
  static readonly type = 'IMPORT_SURVEY';

  @NestedDataType(() => MultilingualTextDto, {
    label: 'name',
    description: 'the name of this survey',
  })
  name: MultilingualTextDto;

  @NestedDataType(() => SurveyQuestionImportDto, {
    isArray: true,
    label: 'questions',
    description: 'an ordered list of top-level questions for this survey',
  })
  questions: SurveyQuestionImportDto[];

  @NestedDataType(() => SurveyAnalyzerImportDto, {
    label: 'analyzers',
    description:
      'a list of analyzers (dynamically configured, user-defined single response reports)',
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  analyzers: SurveyAnalyzerImportDto[];
  /**
   * Note that an imported survey is meant to be completely "hands off" aside from opening access.
   * As such, imported surveys are automatically published (finalized).
   */
}
