import { FlagViewModel } from 'src/features/flags/queries';
import { CreateFlag } from '../../../features/flags/commands';
import { SurveyViewModelClientDto } from '../../../features/survey/queries/survey.view-model';
import {
  ImportSurvey,
  SurveyAnalyzerImportDto,
  SurveyOptionImportDto,
  SurveyQuestionImportDto,
} from '../../../features/survey/survey-management';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { buildTestInstance } from '../../../libs/data-types';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
} from '../utils';
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

// TODO From env.e2e
const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const surveyCommandsEndpoint = `${surveyIndexEndpoint}/commands`;

const surveyTestSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const surveyName = 'Evaluation 1.B';

const shouldError = 'should return the expected error';

const httpClient = new TestHttpClient('http://localhost:4200');

const RED = 'red';
const WHITE = 'white';
const YELLOW = 'yellow';
const BLACK = 'black';

const validCategories = [RED, WHITE, YELLOW, BLACK];

const validAnalyzer = buildTestInstance(SurveyAnalyzerImportDto, {
  name: {
    text: 'medicine wheel',
  },
  categories: validCategories,
});

const newFlagLabelForTopLevelQuestion = 'brand new flag for top level question';
const newTopLevelFlagDescription = `this is the ${newFlagLabelForTopLevelQuestion}`;

const newFlagForFollowUpQuestion = {
  label: 'brand new flag for follow-up question',
  description: 'this is a brand new flag for a follow-up question',
};

const existingFlagForFollowUpQuestion = {
  label: 'existing flag in for follow-up question',
};

const existingFlagForTopLevelQuestion = {
  label: 'existing flag for top-level question',
};

// TODO test new flag generation

const labelForFollowUpQuestion = '1.1';

const labelForFollowUpOptionWithFlag = 'a';

const optionLabelForFollowUpOptionWithNewFlag = 'b';

const followUpQuestion = {
  label: labelForFollowUpQuestion,
  prompt: 'Do you often wish you were somewhere else?',
  options: [
    {
      label: labelForFollowUpOptionWithFlag,
      text: 'yes',
      flags: [existingFlagForFollowUpQuestion],
      valuesByAnalyzerName: {
        [validAnalyzer.name.text]: {
          [RED]: 1,
        },
      },
    },
    {
      label: optionLabelForFollowUpOptionWithNewFlag,
      text: 'no',
      flags: [newFlagForFollowUpQuestion],
      valuesByAnalyzerName: {
        [validAnalyzer.name.text]: {
          [WHITE]: 1,
        },
      },
    },
  ],
};

const optionA: SurveyOptionImportDto = {
  label: 'a',
  text: 'yes (leads to black)',
  flags: [],
  valuesByAnalyzerName: {
    [validAnalyzer.name.text]: {
      [BLACK]: 1,
    },
  },
  followUpQuestion,
};

const labelForTopLevelOptionWithExistingFlag = 'b';

const labelForTopLevelQuestionWithNewFlag = 'c';

const optionsForQuestionToManuallyVerify = [
  optionA,
  {
    label: labelForTopLevelOptionWithExistingFlag,
    text: 'no',
    flags: [existingFlagForTopLevelQuestion],
    valuesByAnalyzerName: {
      [validAnalyzer.name.text]: {
        [YELLOW]: 1,
      },
    },
  },
  {
    label: labelForTopLevelQuestionWithNewFlag,
    text: 'maybe',
    flags: [
      {
        label: newFlagLabelForTopLevelQuestion,
        description: newTopLevelFlagDescription,
      },
    ],
    valuesByAnalyzerName: {
      [validAnalyzer.name.text]: {
        [WHITE]: 1,
      },
    },
  },
];

const labelForQuestionToManuallyVerify = '1';

const question1: SurveyQuestionImportDto = {
  prompt: 'Do you ever want to just leave it all behind?',
  label: labelForQuestionToManuallyVerify,
  options: optionsForQuestionToManuallyVerify,
};

const questionWithFollowupQuestion: SurveyQuestionImportDto = {
  prompt: 'Say no to me to find your next adventure!',
  label: '2',
  options: [
    {
      label: 'a',
      text: 'no',
      valuesByAnalyzerName: {},
      flags: [],
      followUpQuestion: {
        label: '2.1',
        prompt: 'Are you happy with yourself now?',
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
            flags: [],
            valuesByAnalyzerName: {},
            followUpQuestion: {
              label: '2.1.1',
              prompt: 'Is it because you followed your own adventure?',
              options: [
                {
                  label: 'a',
                  text: 'yes',
                  flags: [existingFlagForFollowUpQuestion],
                  valuesByAnalyzerName: {},
                },
                {
                  label: 'b',
                  text: 'no',
                  flags: [],
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
      text: 'yes',
      flags: [],
      valuesByAnalyzerName: {},
    },
  ],
};

const validQuestions = [question1, questionWithFollowupQuestion];

const flagIndexEndpoint = `${baseEndpoint}/flags`;

const flagTestSetupEndpoint = `${flagIndexEndpoint}/test-setup`;

const flagCommandsEndpoint = `${flagIndexEndpoint}/commands`;

describe(`Survey Import Scenarios`, () => {
  beforeAll(async () => {
    // TODO test when the user does not have sufficient permissions
    // We ensure the user has permission to execute commands
    await signInAsAdmin(httpClient);
  });

  beforeEach(async () => {
    await httpClient.patch(surveyTestSetupEndpoint);

    await httpClient.patch(flagTestSetupEndpoint);

    await assertCommandScenarioSuccess({
      httpClient,
      endpoint: flagCommandsEndpoint,
      stream: TestCommandStream.first(CreateFlag, {
        label: existingFlagForFollowUpQuestion.label,
        description: 'test existing flag for follow-up question',
      }),
    });

    await assertCommandScenarioSuccess({
      httpClient,
      endpoint: flagCommandsEndpoint,
      stream: TestCommandStream.first(CreateFlag, {
        label: existingFlagForTopLevelQuestion.label,
        description: 'test existing flag for top-level question',
      }),
    });
  });

  describe(`when the import is valid`, () => {
    describe(`when an analyzer is provided`, () => {
      const validImport = TestCommandStream.first(ImportSurvey, {
        name: {
          text: surveyName,
        },
        analyzers: [validAnalyzer],
        questions: validQuestions,
      });

      it(`should create the finalized survey`, async () => {
        await assertCommandScenarioSuccess({
          httpClient,
          endpoint: surveyCommandsEndpoint,
          stream: validImport,
          assertSuccess: async (acks) => {
            const { id } = acks[0];

            /**
             * We do this here because new flags are created as a side-effect of
             * command execution.
             */
            const flagIdsByLabel = new Map<string, string>();

            const flagQueryResponse = await httpClient.get(flagIndexEndpoint);

            const flags = flagQueryResponse.data as FlagViewModel[];

            flags.forEach((f) => {
              flagIdsByLabel.set(f.label, f.id);
            });

            const searchResult = (
              await httpClient.get(`${surveyIndexEndpoint}/${id}`)
            ).data as SurveyViewModelClientDto;

            expect(searchResult.name).toBe(surveyName);

            // TODO we hard-wire this to avoid using a recursive helper to make this dynamic
            const numberOfFollowupQuestionsInValidSurvey = 3;

            expect(searchResult.size).toBe(
              validQuestions.length + numberOfFollowupQuestionsInValidSurvey,
            );

            const foundFirstQuestion = searchResult.questions[0];

            expect(foundFirstQuestion.label).toBe(question1.label);
            expect(foundFirstQuestion.prompt).toBe(question1.prompt);
            expect(Object.keys(foundFirstQuestion.options)).toHaveLength(
              optionsForQuestionToManuallyVerify.length,
            );

            // options are persisted as a lookup-table, not an ordered list
            const foundOption = foundFirstQuestion.options[optionA.label];

            expect(foundOption.label).toBe(optionA.label);

            expect(foundOption.text).toBe(optionA.text);

            expect(foundOption.followUpQuestions).toHaveLength(1);

            const valuesForMedicineWheel =
              foundOption.valuesByAnalyzerName[validAnalyzer.name.text];

            expect(BLACK in valuesForMedicineWheel).toBe(true);
            expect(valuesForMedicineWheel[BLACK]).toBe(1);

            expect(RED in valuesForMedicineWheel).toBe(false);
            expect(WHITE in valuesForMedicineWheel).toBe(false);
            expect(YELLOW in valuesForMedicineWheel).toBe(false);

            const foundFollowupQuestion = foundOption.followUpQuestions[0];

            expect(foundFollowupQuestion.label).toBe(followUpQuestion.label);
            expect(foundFollowupQuestion.prompt).toBe(followUpQuestion.prompt);
            expect(Object.keys(foundFollowupQuestion.options)).toHaveLength(
              followUpQuestion.options.length,
            );

            const assertOptionHasFlag = ({
              questionLabel,
              optionLabel,
              flag,
            }: {
              questionLabel: string;
              optionLabel: string;
              // followUpQuestion #, optionLabel, followUpQuestion #, optionLabel ...
              followUpOptionPath?: (string | number)[];
              flag: { label: string; description?: string };
            }) => {
              const targetFlagId = flagIdsByLabel.get(flag.label);

              expect(targetFlagId).toBeTruthy();

              if (!targetFlagId) {
                throw new Error(
                  `Test failed as no flag with the label: ${flag.label} was created during the import.`,
                );
              }

              const targetQuestion = searchResult.questionsFlattened.find(
                ({ label }) => label === questionLabel,
              );

              if (!targetQuestion) {
                throw new Error(
                  `Test failed. No question with label: ${questionLabel} was found.`,
                );
              }

              const targetOption = targetQuestion.options[optionLabel];

              if (!targetOption) {
                throw new Error(
                  `Test failed. No option with label [${optionLabel}] was found in question [${questionLabel}].`,
                );
              }

              const { flags: flagsForTargetOption } = targetOption;

              const targetFlagForOption = flagsForTargetOption[targetFlagId];

              expect(targetFlagForOption).toBeTruthy();

              if (!targetFlagForOption) {
                throw new Error(
                  `Test failed. No flag with label [${flag.label}] and ID [${targetFlagId}] was found.`,
                );
              }

              expect(targetFlagForOption.label).toBe(flag.label);

              if (flag.description) {
                expect(targetFlagForOption.description).toBe(flag.description);
              }
            };

            // top-level question, existing flag
            assertOptionHasFlag({
              questionLabel: labelForQuestionToManuallyVerify,
              optionLabel: labelForTopLevelOptionWithExistingFlag,
              flag: {
                label: existingFlagForTopLevelQuestion.label,
              },
            });

            // top-level question, new flag
            assertOptionHasFlag({
              questionLabel: labelForQuestionToManuallyVerify,
              optionLabel: labelForTopLevelQuestionWithNewFlag,
              flag: {
                label: newFlagLabelForTopLevelQuestion,
                description: newTopLevelFlagDescription,
              },
            });

            // follow-up question, existing flag
            assertOptionHasFlag({
              questionLabel: labelForFollowUpQuestion,
              optionLabel: labelForFollowUpOptionWithFlag,
              flag: existingFlagForFollowUpQuestion,
            });

            // follow-up question, new flag
            assertOptionHasFlag({
              questionLabel: labelForFollowUpQuestion,
              optionLabel: optionLabelForFollowUpOptionWithNewFlag,
              flag: newFlagForFollowUpQuestion,
            });
          },
        });
      });
    });
  });

  describe(`when the import is invalid`, () => {
    describe(`when no questions are provided`, () => {
      const importWithNoQuestions = TestCommandStream.first(ImportSurvey, {
        name: {
          text: surveyName,
        },
        analyzers: [validAnalyzer],
        questions: [],
      });

      it(shouldError, async () => {
        await assertCommandScenarioError({
          httpClient,
          endpoint: surveyCommandsEndpoint,
          stream: importWithNoQuestions,
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(message, 'questions', 'must not be empty');
          },
        });
      });
    });

    describe(`when one of the questions has too few options`, () => {
      const importWithNoOptionsForOneQuestion = TestCommandStream.first(
        ImportSurvey,
        {
          name: {
            text: surveyName,
          },
          analyzers: [validAnalyzer],
          questions: [
            {
              ...question1,
              options: [],
            },
          ],
        },
      );

      describe(`0 options`, () => {
        it(shouldError, async () => {
          await assertCommandScenarioError({
            httpClient,
            endpoint: surveyCommandsEndpoint,
            stream: importWithNoOptionsForOneQuestion,
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                surveyName,
                question1.label,
                'at least 2 options',
                'has 0 options',
              );
            },
          });
        });
      });

      describe(`1 option`, () => {
        const importWithTooFewOptionsForOneQuestion = TestCommandStream.first(
          ImportSurvey,
          {
            name: {
              text: surveyName,
            },
            analyzers: [validAnalyzer],
            questions: [
              {
                ...question1,
                options: [optionA],
              },
            ],
          },
        );

        it(shouldError, async () => {
          await assertCommandScenarioError({
            httpClient,
            endpoint: surveyCommandsEndpoint,
            stream: importWithTooFewOptionsForOneQuestion,
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                surveyName,
                question1.label,
                'at least 2 options',
                'has 1 option',
              );
            },
          });
        });
      });
    });

    // TODO general fuzz testing
    describe(`when a follow-up question has an invalid schema`, () => {
      const invalidQuestionLabel = '10';

      const invalidOptionLabel = 'b';

      const importWithInvalidFollowupQuestion = TestCommandStream.first(
        ImportSurvey,
        {
          name: {
            text: surveyName,
          },
          analyzers: [validAnalyzer],
          questions: [
            ...validQuestions,
            {
              label: invalidQuestionLabel,
              prompt: 'Something is wrong with one of my followup questions',
              options: [
                {
                  label: 'a',
                  text: 'this one is ok',
                  flags: [],
                  valuesByAnalyzerName: {},
                },
                {
                  label: invalidOptionLabel,
                  text: 'this option has an invalid follow-up question',
                  followUpQuestion: {
                    label: ['why am I an array?'] as unknown as string,
                    options: [
                      {
                        label: 'a',
                        text: 'True',
                        valuesByAnalyzerName: {},
                        flags: [],
                      },
                      {
                        label: 'b',
                        text: 'False',
                        valuesByAnalyzerName: {},
                        flags: [],
                      },
                    ],
                  },
                  flags: [],
                  valuesByAnalyzerName: {},
                },
              ],
            },
          ],
        },
      );

      it(`should return the expected error`, async () => {
        await assertCommandScenarioError({
          httpClient,
          endpoint: surveyCommandsEndpoint,
          stream: importWithInvalidFollowupQuestion,
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              surveyName,
              invalidQuestionLabel,
              'ill-formed entity',
              'SurveyOption',
              'Expected non-empty text',
              'received [object]',
            );
          },
        });
      });
    });

    describe(`when an analyzer is invalid`, () => {
      /**
       * Currently, there's no rule against this. If you run the report for this
       * analyzer, you'll just get an empty report. This is only for internal admin purposes.
       * So if this doesn't cause any confusion or inconvenience in the admin UX, we
       * should keep it simple and avoid this rule.
       */
      describe.skip(`when it has no categories`, () => {
        const invalidAnalyzerDto = buildTestInstance(SurveyAnalyzerImportDto, {
          categories: [],
        });

        const importWithEmptyAnalyzer = TestCommandStream.first(ImportSurvey, {
          name: {
            text: surveyName,
          },
          questions: validQuestions,
          analyzers: [invalidAnalyzerDto],
        });

        it(shouldError, async () => {
          await assertCommandScenarioError({
            httpClient,
            endpoint: surveyCommandsEndpoint,
            stream: importWithEmptyAnalyzer,
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(message, 'whoa batman!');
            },
          });
        });
      });

      describe(`when an option references an unlisted analyzer`, () => {
        const invalidAnalyzerDto = buildTestInstance(SurveyAnalyzerImportDto, {
          categories: ['red', 'white', 'yellow', 'black'],
        });

        const validValue = 200;

        const invalidValues = {
          [invalidAnalyzerDto.name.text]: {
            [validCategories[0]]: validValue,
          },
        };

        describe(`when the option belongs to a top-level question`, () => {
          const importWithInvalidAnalyzer = TestCommandStream.first(
            ImportSurvey,
            {
              name: {
                text: surveyName,
              },
              questions: [
                {
                  ...question1,
                  options: [
                    {
                      ...optionA,
                      valuesByAnalyzerName: invalidValues,
                    },
                    {
                      label: 'x',
                      text: 'this one is ok',
                      flags: [],
                      valuesByAnalyzerName: {},
                    },
                  ],
                },
              ],
            },
          );

          it(`should error`, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: importWithInvalidAnalyzer,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  question1.label,
                  optionA.label,
                  invalidAnalyzerDto.name.text,
                  // invalidCategoryName,
                );
              },
            });
          });
        });

        describe(`when the option belongs to a follow-up question`, () => {
          const invalidImport = TestCommandStream.first(ImportSurvey, {
            name: {
              text: surveyName,
            },
            analyzers: [validAnalyzer],
            questions: [
              {
                ...question1,
                options: [
                  {
                    ...optionA,
                    followUpQuestion: {
                      ...followUpQuestion,
                      options: [
                        {
                          ...followUpQuestion.options[0],
                          valuesByAnalyzerName: invalidValues,
                        },
                        followUpQuestion.options[1],
                      ],
                    },
                  },
                  {
                    label: 'x',
                    text: 'this one is ok',
                    flags: [],
                    valuesByAnalyzerName: {},
                  },
                ],
              },
            ],
          });

          it(shouldError, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: invalidImport,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  followUpQuestion.label,
                  followUpQuestion.options[0].label,
                  invalidAnalyzerDto.name.text,
                );
              },
            });
          });
        });
      });

      describe(`when an option references an unlisted category for a listed analyzer`, () => {
        const invalidCategoryName = 'purple';

        const validValue = 200;

        describe(`when the option belongs to a top-level question`, () => {
          const importWithInvalidOptionValue = TestCommandStream.first(
            ImportSurvey,
            {
              name: {
                text: surveyName,
              },
              analyzers: [validAnalyzer],
              questions: [
                {
                  ...question1,
                  options: [
                    {
                      ...optionA,
                      valuesByAnalyzerName: {
                        [validAnalyzer.name.text]: {
                          [invalidCategoryName]: validValue,
                        },
                      },
                    },
                    {
                      label: 'x',
                      text: 'this one is ok',
                      flags: [],
                      valuesByAnalyzerName: {},
                    },
                  ],
                },
              ],
            },
          );

          it(shouldError, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: importWithInvalidOptionValue,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  question1.label,
                  optionA.label,
                  validAnalyzer.name.text,
                  invalidCategoryName,
                  'no such category',
                );
              },
            });
          });
        });

        describe(`when the option belongs to a follow-up question`, () => {
          const invalidImport = TestCommandStream.first(ImportSurvey, {
            name: {
              text: surveyName,
            },
            analyzers: [validAnalyzer],
            questions: [
              {
                ...question1,
                options: [
                  {
                    ...optionA,
                    valuesByAnalyzerName: {
                      [validAnalyzer.name.text]: {
                        [invalidCategoryName]: validValue,
                      },
                    },
                  },
                  {
                    label: 'x',
                    text: 'this one is ok',
                    flags: [],
                    valuesByAnalyzerName: {},
                  },
                ],
              },
            ],
          });

          it(shouldError, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: invalidImport,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  validAnalyzer.name.text,
                  invalidCategoryName,
                  question1.label,
                  optionA.label,
                );
              },
            });
          });
        });
      });

      /**
       * array-valued props
       * categories
       * options
       * flags
       * questions
       * analyzers
       */

      describe(`when identity is duplicated across a list of nested entities`, () => {
        describe(`categories`, () => {
          const repeatedCategory = 'red';

          const analyzerName = 'RBG';

          const invalidImport = TestCommandStream.first(ImportSurvey, {
            questions: [question1],
            analyzers: [
              buildTestInstance(SurveyAnalyzerImportDto, {
                name: { text: analyzerName },
                categories: [
                  repeatedCategory,
                  repeatedCategory,
                  'blue',
                  'green',
                ],
              }),
            ],
          });

          it(shouldError, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: invalidImport,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  repeatedCategory,
                  analyzerName,
                  'already has the given category',
                );
              },
            });
          });
        });

        describe(`questions`, () => {
          const invalidImport = TestCommandStream.first(ImportSurvey, {
            name: {
              text: surveyName,
            },
            analyzers: [validAnalyzer],
            questions: [question1, question1],
          });

          it(shouldError, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: invalidImport,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  question1.label,
                  'cannot add',
                  'already',
                );
              },
            });
          });
        });

        describe(`options`, () => {
          const invalidImport = TestCommandStream.first(ImportSurvey, {
            name: {
              text: surveyName,
            },
            analyzers: [validAnalyzer],
            questions: [
              {
                ...question1,
                options: [optionA, optionA],
              },
            ],
          });

          it(shouldError, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: invalidImport,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  question1.label,
                  optionA.label,
                );
              },
            });
          });
        });

        describe(`flags`, () => {
          const repeatedFlag = {
            label: 'dangerous dog',
          };

          const invalidImport = TestCommandStream.first(ImportSurvey, {
            name: {
              text: surveyName,
            },
            analyzers: [validAnalyzer],
            questions: [
              {
                ...question1,
                options: [
                  {
                    ...optionA,
                    flags: [repeatedFlag, repeatedFlag],
                  },
                  {
                    label: 'x',
                    text: 'this one is ok',
                    flags: [],
                    valuesByAnalyzerName: {},
                  },
                ],
              },
            ],
          });

          it(shouldError, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: invalidImport,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  repeatedFlag.label,
                  question1.label,
                  optionA.label,
                );
              },
            });
          });
        });

        describe(`analyzers`, () => {
          const invalidImport = TestCommandStream.first(ImportSurvey, {
            name: {
              text: surveyName,
            },
            questions: [question1],
            analyzers: [validAnalyzer, validAnalyzer],
          });

          it(shouldError, async () => {
            await assertCommandScenarioError({
              httpClient,
              endpoint: surveyCommandsEndpoint,
              stream: invalidImport,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  'cannot add',
                  validAnalyzer.name.text,
                  'already has',
                );
              },
            });
          });
        });
      });
    });
  });
});
