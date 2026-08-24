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

export class SurveyFlagImportDto {
  @NonEmptyString({
    label: 'label',
    description: 'user-facing label for this flag',
  })
  label: string;

  @NonEmptyString({
    label: 'description',
    description: `description of this flag's purpose (required only if adding a new flag)`,
    isOptional: true,
  })
  description?: string;
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
   * Follow-up questions are validated indirectly via `Survey.validateInvariants`.
   * This works, but we may want to manually validate this property against a schema
   * in the command-handler to fail faster and to provide more meaningful error messages.
   */
  @RawObject({
    label: 'follow-up question',
    description: 'Question to be asked in case the user selects this option',
    isOptional: true,
  })
  // TODO spelling? followupQuestion?
  followUpQuestion?: SurveyQuestionImportDto;

  @NestedDataType(() => SurveyFlagImportDto, {
    label: 'flags',
    description: 'a list of flags to apply to this option',
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  /**
   * These will either be created or looked up if existing.
   */
  flags: SurveyFlagImportDto[];

  @LookupTable('number', {
    label: 'values by analyzer name',
    description:
      'for each analyzer in this survey, for each category of the analyzer, what value does this option introduce?',
    depth: 2,
  })
  valuesByAnalyzerName: Record<string, Record<string, number>>;
}

/**
 * For lack of a better place, we include this here. Convert this to JSON
 * and use Swagger to see a full test survey.
 *
 * TODO Update `buildTestInstance` to deal with non-empty lookup tables and arrays
 * in the sample data so we can make our `@DataExample`s comprehensive.
 */
const _tempExample: ImportSurvey = {
  name: {
    text: 'DSS Client Evaluation (Medicine Wheel)',
  },
  questions: [
    {
      label: '',
      prompt: '',
      options: [
        {
          label: 'a',
          text: 'I sometimes feel sad',
          flags: [
            {
              label: 'my flag',
              description: 'description for test flag',
            },
          ],
          valuesByAnalyzerName: {
            'medicine wheel': {
              red: 1,
            },
          },
          followUpQuestion: {
            label: '1.1',
            prompt: 'My sadness lasts for',
            options: [
              {
                label: 'a',
                text: 'a few hours',
                flags: [],
                valuesByAnalyzerName: {},
              },
              {
                label: 'b',
                text: 'a few days',
                flags: [],
                valuesByAnalyzerName: {},
              },
              {
                label: 'c',
                text: 'a few weeks',
                flags: [],
                valuesByAnalyzerName: {},
                followUpQuestion: {
                  label: '1.1.1',
                  prompt: 'I am currently seeking help for my sadness',
                  options: [
                    {
                      label: 'a',
                      text: 'yes',
                      flags: [],
                      valuesByAnalyzerName: {},
                    },
                    {
                      label: 'b',
                      text: 'no',
                      flags: [
                        {
                          label: 'requires immediate help',
                          description:
                            'client flagged for immediate intervention',
                        },
                      ],
                      valuesByAnalyzerName: {},
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          label: 'b',
          text: 'I never feel sad',
          flags: [],
          valuesByAnalyzerName: {
            'medicine wheel': {
              white: 1,
            },
          },
        },
      ],
    },
  ],
  analyzers: [
    {
      name: {
        text: 'medicine wheel',
      },
      categories: ['red', 'white', 'yellow', 'black'],
    },
  ],
};

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
   * As such, imported surveys are automatically finalized.
   */
}
