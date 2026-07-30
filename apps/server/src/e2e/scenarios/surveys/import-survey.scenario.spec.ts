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

const newFlag = 'flight risk';

// TODO test new flag generation

const followUpQuestion = {
  label: '1.1',
  prompt: 'Do you often wish you were somewhere else?',
  options: [
    {
      label: 'a',
      text: 'yes',
      flags: [newFlag],
      valuesByAnalyzerName: {},
    },
    {
      label: 'b',
      text: 'no',
      flags: [],
      valuesByAnalyzerName: {},
    },
  ],
};

const optionA: SurveyOptionImportDto = {
  label: 'a',
  text: 'yes',
  flags: [newFlag],
  valuesByAnalyzerName: {},
  followUpQuestion,
};

const optionsForQuestionToManuallyVerify = [
  optionA,
  {
    label: 'b',
    text: 'no',
    flags: [],
    valuesByAnalyzerName: {},
  },
  {
    label: 'c',
    text: 'maybe',
    flags: [],
    valuesByAnalyzerName: {},
  },
];

const question1: SurveyQuestionImportDto = {
  prompt: 'Do you ever want to just leave it all behind?',
  label: '1',
  options: optionsForQuestionToManuallyVerify,
};

// TODO add more
const validQuestions = [question1];

const validCategories = ['red', 'white', 'yellow', 'black'];

const validAnalyzer = buildTestInstance(SurveyAnalyzerImportDto, {
  name: {
    text: 'medicine wheel',
  },
  categories: validCategories,
});

describe(`Survey Import Scenarios`, () => {
  beforeAll(async () => {
    // TODO test when the user does not have sufficient permissions
    // We ensure the user has permission to execute commands
    await signInAsAdmin(httpClient);
  });

  beforeEach(async () => {
    await httpClient.patch(surveyTestSetupEndpoint);
  });

  describe(`when the import is valid`, () => {
    describe(`when an analyzer is provided`, () => {
      it.todo(
        `should create a published (finalized) survey with the given analyzer`,
      );
    });

    describe(`when no analyzer is provided`, () => {
      const validImport = TestCommandStream.first(ImportSurvey, {
        name: {
          text: surveyName,
        },
        analyzers: [],
        questions: validQuestions,
      });

      it(`should create the published (finalized survey)`, async () => {
        await assertCommandScenarioSuccess({
          httpClient,
          endpoint: surveyCommandsEndpoint,
          stream: validImport,
          assertSuccess: async (acks) => {
            const { id } = acks[0];

            const searchResult = (
              await httpClient.get(`${surveyIndexEndpoint}/${id}`)
            ).data as SurveyViewModelClientDto;

            expect(searchResult.name).toBe(surveyName);

            const numberOfFollowupQuestionsInValidSurvey =
              validQuestions.flatMap((q) =>
                q.options.flatMap((o) =>
                  o.followUpQuestion ? [o.followUpQuestion] : [],
                ),
              ).length;

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

            const foundFollowupQuestion = foundOption.followUpQuestions[0];

            expect(foundFollowupQuestion.label).toBe(followUpQuestion.label);
            expect(foundFollowupQuestion.prompt).toBe(followUpQuestion.prompt);
            expect(Object.keys(foundFollowupQuestion.options)).toHaveLength(
              followUpQuestion.options.length,
            );

            // TODO check flags here or elsewhere
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
        analyzers: [],
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

        const invalidCategoryName = 'purple';

        const validValue = 200;

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
                      valuesByAnalyzerName: {
                        [invalidAnalyzerDto.name.text]: {
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
          const repeatedFlag = 'dangerous dog';

          const invalidImport = TestCommandStream.first(ImportSurvey, {
            name: {
              text: surveyName,
            },
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
                  repeatedFlag,
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
