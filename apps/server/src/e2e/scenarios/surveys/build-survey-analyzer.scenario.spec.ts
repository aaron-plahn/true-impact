import axios from 'axios';
import { SurveyViewModelClientDto } from '../../../features/survey/queries/survey.view-model';
import {
  AddCategoryToSurveyAnalyzer,
  AddValueForSurveyOption,
  CreateAnalyzerForSurvey,
} from '../../../features/survey/survey-analysis';
import { AddOptionToSurveyQuestion } from '../../../features/survey/survey-management/commands/add-option-to-survey-question.command';
import { AddQuestionToSurvey } from '../../../features/survey/survey-management/commands/add-question-to-survey.command';
import { CreateSurvey } from '../../../features/survey/survey-management/commands/create-survey.command';
import { PublishSurvey } from '../../../features/survey/survey-management/commands/publish-survey.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
} from '../utils';

// TODO From env.e2e
const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const surveyCommandsEndpoint = `${surveyIndexEndpoint}/commands`;

const surveyTestSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const missingSurveyId = 's404';

const surveyName = 'Evaluation 1.B';

const createSurvey = TestCommandStream.first(CreateSurvey, {
  name: surveyName,
});

const analyzerName = 'Mood Check';

const category = 'Blue';

const targetQuestion = '1';

const targetOption = 'b';

const validValueForTargetOption = 5;

const addQuestionToSurvey = createSurvey.andThen(AddQuestionToSurvey, {
  label: targetQuestion,
});

const addOptionToSurvey = addQuestionToSurvey
  // we add a second option to ensure we have a valid survey
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: targetQuestion,
    optionLabel: 'a',
    text: 'text for test option a',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: targetQuestion,
    optionLabel: targetOption,
    text: 'text for test option b',
  });

// should we prevent adding an analyzer to a survey that is not yet published?
const publishSurvey = addOptionToSurvey.andThen(PublishSurvey);

const createAnalyzer = publishSurvey.andThen(CreateAnalyzerForSurvey, {
  name: analyzerName,
});

const addCategoryForAnalyzer = createAnalyzer.andThen(
  AddCategoryToSurveyAnalyzer,
  {
    analyzerName,
    category,
  },
);

const addValueForOption = addCategoryForAnalyzer.andThen(
  AddValueForSurveyOption,
  {
    analyzerName,
    questionLabel: targetQuestion,
    optionLabel: targetOption,
    valuesByCategory: {
      [category]: validValueForTargetOption,
    },
  },
);

describe(`Build Survey Analyzer Scenarios`, () => {
  beforeEach(async () => {
    await axios.patch(surveyTestSetupEndpoint);
  });

  describe(`when creating an analyzer`, () => {
    describe(`when the survey exists`, () => {
      describe(`when the survey already has an analyzer`, () => {
        describe(`when the new analyzer name is in conflict with the existing one`, () => {
          it(`should return the expected error resposne`, async () => {
            await assertCommandScenarioError({
              endpoint: surveyCommandsEndpoint,
              stream: createAnalyzer.andThen(CreateAnalyzerForSurvey, {
                name: analyzerName,
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  analyzerName,
                  'already has',
                );
              },
            });
          });
        });

        describe(`when the new analyzer name is unique`, () => {
          it(`should add the analyzer`, async () => {
            const uniqueName = 'Favourite Sports';

            await assertCommandScenarioSuccess({
              endpoint: surveyCommandsEndpoint,
              stream: createAnalyzer.andThen(CreateAnalyzerForSurvey, {
                name: uniqueName,
              }),
              assertSuccess: async (acks) => {
                const { id } = acks[0];

                const updated = (
                  await axios.get(`${surveyIndexEndpoint}/${id}`)
                ).data as SurveyViewModelClientDto;

                expect(uniqueName in updated.analyzersByName).toBe(true);
              },
            });
          });
        });
      });

      describe(`when the survey has no analyzers`, () => {
        it(`should add the analyzer`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: surveyCommandsEndpoint,
            stream: createAnalyzer,
            assertSuccess: async (acks) => {
              const updated = (
                await axios.get(`${surveyIndexEndpoint}/${acks[0].id}`)
              ).data as SurveyViewModelClientDto;

              expect(analyzerName in updated.analyzersByName).toBe(true);

              expect(Object.values(updated.analyzersByName)).toHaveLength(1);
            },
          });
        });
      });
    });

    describe(`when the survey does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandError({
          endpoint: surveyCommandsEndpoint,
          commandFsa: TestCommandStream.buildOne(CreateAnalyzerForSurvey, {
            aggregateCompositeIdentifier: {
              id: missingSurveyId,
            },
            name: analyzerName,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(message, missingSurveyId, analyzerName);
          },
        });
      });
    });
  });

  describe(`when adding a category to an analyzer`, () => {
    describe(`when the survey exists`, () => {
      describe(`when the analyzer exists`, () => {
        describe(`when the analyzer has no categories`, () => {
          it(`should add the first category`, async () => {
            await assertCommandScenarioSuccess({
              endpoint: surveyCommandsEndpoint,
              stream: createAnalyzer.andThen(AddCategoryToSurveyAnalyzer, {
                analyzerName,
                category,
              }),
              assertSuccess: async (acks) => {
                const { analyzersByName } = (
                  await axios.get(`${surveyIndexEndpoint}/${acks[0].id}`)
                ).data as SurveyViewModelClientDto;

                expect(Object.values(analyzersByName)).toHaveLength(1);

                const analyzer = analyzersByName[analyzerName];

                expect(analyzer).toBeTruthy();

                expect(analyzer.categories).toHaveLength(1);

                expect(analyzer.categories).toContain(category);
              },
            });
          });
        });

        describe(`when the analyzer already has categories`, () => {
          describe(`when the new category is unique`, () => {
            const secondCategory = 'Purple';

            it(`should add an additional category`, async () => {
              await assertCommandScenarioSuccess({
                endpoint: surveyCommandsEndpoint,
                stream: addCategoryForAnalyzer.andThen(
                  AddCategoryToSurveyAnalyzer,
                  {
                    analyzerName,
                    category: secondCategory,
                  },
                ),
                assertSuccess: async (acks) => {
                  const { analyzersByName } = (
                    await axios.get(`${surveyIndexEndpoint}/${acks[0].id}`)
                  ).data as SurveyViewModelClientDto;

                  expect(Object.entries(analyzersByName)).toHaveLength(1);

                  const { categories } = analyzersByName[analyzerName];

                  expect(categories).toHaveLength(2);

                  expect(categories).toContain(category);

                  expect(categories).toContain(secondCategory);
                },
              });
            });
          });

          describe(`when the new category name conflicts with an existing name`, () => {
            it(`should return the expected error response`, async () => {
              await assertCommandScenarioError({
                endpoint: surveyCommandsEndpoint,
                stream: addCategoryForAnalyzer.andThen(
                  AddCategoryToSurveyAnalyzer,
                  {
                    analyzerName,
                    category,
                  },
                ),
                assertErrorMessageAsExpected: (message) => {
                  assertTextMatchesAll(
                    message,
                    surveyName,
                    analyzerName,
                    category,
                    'already has',
                  );
                },
              });
            });
          });
        });
      });

      describe(`when the analyzer does not exist`, () => {
        it(`should return the expected error response`, async () => {
          await assertCommandScenarioError({
            endpoint: surveyCommandsEndpoint,
            stream: createSurvey.andThen(AddCategoryToSurveyAnalyzer, {
              analyzerName,
              category,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                surveyName,
                analyzerName,
                category,
                'no such analyzer',
              );
            },
          });
        });
      });
    });

    describe(`when the survey does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandError({
          endpoint: surveyCommandsEndpoint,
          commandFsa: TestCommandStream.buildOne(AddCategoryToSurveyAnalyzer, {
            aggregateCompositeIdentifier: {
              id: missingSurveyId,
            },
            analyzerName,
            category,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              missingSurveyId,
              analyzerName,
              category,
            );
          },
        });
      });
    });
  });

  describe(`when adding values for a question's option`, () => {
    describe(`when the survey exists`, () => {
      describe(`when the target question exiszts`, () => {
        describe(`when the target option exists`, () => {
          describe(`when the analyzer exists`, () => {
            describe(`when all categories exist`, () => {
              describe(`when all values are valid`, () => {
                it(`should add the values`, async () => {
                  await assertCommandScenarioSuccess({
                    endpoint: surveyCommandsEndpoint,
                    stream: addValueForOption,
                    assertSuccess: async (acks) => {
                      const { id: surveyId } = acks[0];

                      const fetchResult = (
                        await axios.get(`${surveyIndexEndpoint}/${surveyId}`)
                      ).data as SurveyViewModelClientDto;

                      const { analyzersByName } = fetchResult;

                      expect(
                        Array.from(Object.values(analyzersByName)),
                      ).toHaveLength(1);

                      const targetAnalyzer = analyzersByName[analyzerName];

                      expect(targetAnalyzer).toBeTruthy();

                      expect(
                        targetAnalyzer.valuesByOptionByQuestion[targetQuestion][
                          targetOption
                        ][category],
                      ).toBe(validValueForTargetOption);
                    },
                  });
                });
              });

              describe(`when one of the values is invalid`, () => {
                describe(`because one of the categories already has a value for the given option`, () => {
                  const newValue = 10;

                  it(`should return the expected error response`, async () => {
                    await assertCommandScenarioError({
                      endpoint: surveyCommandsEndpoint,
                      stream: addValueForOption.andThen(
                        AddValueForSurveyOption,
                        {
                          analyzerName,
                          questionLabel: targetQuestion,
                          optionLabel: targetOption,
                          valuesByCategory: {
                            [category]: newValue,
                          },
                        },
                      ),
                      assertErrorMessageAsExpected: (message) => {
                        assertTextMatchesAll(
                          message,
                          surveyName,
                          targetQuestion,
                          targetOption,
                          analyzerName,
                          validValueForTargetOption.toString(),
                          newValue.toString(),
                          category,
                        );
                      },
                    });
                  });
                });

                describe(`because one of the values is negative`, () => {
                  it(`should return the expected error response`, async () => {
                    const invalidValue = -20;

                    await assertCommandScenarioError({
                      endpoint: surveyCommandsEndpoint,
                      stream: createAnalyzer.andThen(AddValueForSurveyOption, {
                        questionLabel: targetQuestion,
                        optionLabel: targetOption,
                        valuesByCategory: {
                          [category]: invalidValue,
                        },
                      }),
                      assertErrorMessageAsExpected: (message) => {
                        assertTextMatchesAll(
                          message,
                          surveyName,
                          targetQuestion,
                          targetOption,
                          category,
                          invalidValue.toString(),
                        );
                      },
                    });
                  });
                });
              });
            });

            describe(`when one of the categories does not exist`, () => {
              it(`should return the expected error response`, async () => {
                const missingCategory = 'spunk';

                await assertCommandScenarioError({
                  endpoint: surveyCommandsEndpoint,
                  stream: addCategoryForAnalyzer.andThen(
                    AddValueForSurveyOption,
                    {
                      analyzerName,
                      questionLabel: targetQuestion,
                      optionLabel: targetOption,
                      valuesByCategory: {
                        [missingCategory]: validValueForTargetOption,
                      },
                    },
                  ),
                  assertErrorMessageAsExpected: (message) => {
                    assertTextMatchesAll(
                      message,
                      surveyName,
                      analyzerName,
                      targetQuestion,
                      targetOption,
                      missingCategory,
                      'no such category',
                    );
                  },
                });
              });
            });
          });

          describe(`when the analyzer does not exist`, () => {
            it(`should return the expected error response`, async () => {
              await assertCommandScenarioError({
                endpoint: surveyCommandsEndpoint,
                stream: publishSurvey.andThen(AddValueForSurveyOption, {
                  analyzerName,
                  questionLabel: targetQuestion,
                  optionLabel: targetOption,
                }),
                assertErrorMessageAsExpected: (message) => {
                  assertTextMatchesAll(
                    message,
                    surveyName,
                    analyzerName,
                    'does not exist',
                  );
                },
              });
            });
          });
        });

        describe(`when the target option does not exist`, () => {
          const missingOption = 'Jx';

          it(`should return the expected error response`, async () => {
            await assertCommandScenarioError({
              endpoint: surveyCommandsEndpoint,
              stream: addValueForOption.andThen(AddValueForSurveyOption, {
                questionLabel: targetQuestion,
                optionLabel: missingOption,
                valuesByCategory: {
                  [category]: validValueForTargetOption,
                },
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  targetQuestion,
                  missingOption,
                  'no such option',
                  // we don't print out the values that are being added in this case because it's awkward to stringify the key-value pairs
                );
              },
            });
          });
        });
      });

      describe(`when the target question does not exist`, () => {
        const missingQuestionLabel = '02';

        it(`should return the expected error response`, async () => {
          await assertCommandScenarioError({
            endpoint: surveyCommandsEndpoint,
            stream: addValueForOption.andThen(AddValueForSurveyOption, {
              questionLabel: missingQuestionLabel,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                surveyName,
                missingQuestionLabel,
                'no such question',
              );
            },
          });
        });
      });
    });

    describe(`when the survey does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandError({
          endpoint: surveyCommandsEndpoint,
          commandFsa: TestCommandStream.buildOne(AddValueForSurveyOption, {
            aggregateCompositeIdentifier: {
              id: missingSurveyId,
            },
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(message, missingSurveyId, 'no such survey');
          },
        });
      });
    });
  });
});
