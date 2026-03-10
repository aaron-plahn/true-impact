import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import { SurveyAnalysisCategory } from '../survey-analysis/models/survey-analysis-category';
import { Survey } from './survey.aggregate-root';

const surveyName = 'Staff Evaluation';

const analyzerName = 'medicine wheel';

const existingValue = 7;

const targetSurvey = buildTestInstance(
  Survey,
  {
    name: surveyName,
    topLevelQuestionLabels: ['1', '3'],
    questions: {
      1: {
        prompt: 'Would you like to see question 2?',
        options: {
          a: {
            text: 'yes',
            nextQuestionLabel: '2',
          },
          b: {
            text: 'no',
          },
        },
      },
      2: {
        prompt: 'Do you like question 2?',
        options: {
          a: {
            text: 'yes',
          },
          b: {
            text: 'no',
          },
          c: {
            text: 'maybe so',
          },
        },
      },
      3: {
        prompt: 'Will you take my survey again some day?',
        options: {
          a: {
            text: 'yes',
          },
          b: {
            text: 'no',
          },
          c: {
            text: 'maybe so',
          },
        },
      },
    },
    analyzers: {
      [analyzerName]: {
        name: 'Balance Checker',
        categories: {
          red: SurveyAnalysisCategory.fromPersistenceDto({
            label: 'red',
          }) as SurveyAnalysisCategory,
          white: SurveyAnalysisCategory.fromPersistenceDto({
            label: 'white',
          }) as SurveyAnalysisCategory,
          yellow: SurveyAnalysisCategory.fromPersistenceDto({
            label: 'yellow',
          }) as SurveyAnalysisCategory,
          black: SurveyAnalysisCategory.fromPersistenceDto({
            label: 'black',
          }) as SurveyAnalysisCategory,
        },
        valuesByQuestion: {
          // can we have type-safety here?
          1: {
            a: {
              white: existingValue,
            },
            b: {
              yellow: 1,
            },
          },
          2: {
            a: {
              white: 1,
            },
            b: {
              yellow: 1,
            },
            // 2(c) has no values to start
            // c: {
            //   red: 1,
            // },
          },
          // 3 has no values to start
          //   3: {
          //     a: {
          //       white: 1,
          //     },
          //     b: {
          //       yellow: 1,
          //     },
          //     c: {
          //       red: 1,
          //     },
          //   },
        },
      },
    },
  },
  { shouldValidate: true },
);

const targetQuestionLabel = '2';
const targetOptionLabel = 'c';
const targetCategory = 'red';

// TODO change method name?
describe(`Survey.addValueForOption`, () => {
  describe(`when the target analyzer exists`, () => {
    describe(`when the target question exists`, () => {
      describe(`when the target option exists`, () => {
        describe(`when adding a value for one category`, () => {
          describe(`when the category exists`, () => {
            describe(`when it does not already have a value`, () => {
              describe(`when the value is a positive integer`, () => {
                const newValue = 1;

                it(`should add the new value`, () => {
                  const result = targetSurvey.addValueForOption({
                    analyzerName,
                    questionLabel: targetQuestionLabel,
                    optionLabel: targetOptionLabel,
                    valuesByCategory: {
                      [targetCategory]: newValue,
                    },
                  });

                  expect(result).toBeInstanceOf(Survey);

                  const updated = result as Survey;

                  expect(
                    updated.analyzersByName
                      .get(analyzerName)
                      // should this take in an object?
                      ?.getValueFor({
                        questionLabel: targetQuestionLabel,
                        optionLabel: targetOptionLabel,
                        category: targetCategory,
                      }),
                  ).toBe(newValue);

                  expect(updated.analyzersByName.get('white')).toBe(undefined);
                });
              });

              describe(`when the value is negative`, () => {
                it(`should return the expected error`, () => {
                  const invalidValue = -15;

                  const result = targetSurvey.addValueForOption({
                    analyzerName,
                    questionLabel: targetQuestionLabel,
                    optionLabel: targetOptionLabel,
                    valuesByCategory: {
                      [targetCategory]: invalidValue,
                    },
                  });

                  expect(result).toBeInstanceOf(TrueImpactError);

                  assertTextMatchesAll(
                    (result as TrueImpactError).toString(),
                    invalidValue.toString(),
                    'positive integer',
                    surveyName,
                    analyzerName,
                    targetQuestionLabel,
                    targetOptionLabel,
                    targetCategory,
                  );
                });
              });
            });

            describe(`when the category already has a value`, () => {
              const existingCategory = 'white';
              const existingOptionLabel = 'a';
              const existingQuestionLabel = '1';

              const newValue = 12;

              it(`should return the expected error`, () => {
                const result = targetSurvey.addValueForOption({
                  analyzerName,
                  questionLabel: existingQuestionLabel,
                  optionLabel: existingOptionLabel,
                  valuesByCategory: {
                    [existingCategory]: newValue,
                  },
                });

                expect(result).toBeInstanceOf(TrueImpactError);

                assertTextMatchesAll(
                  (result as TrueImpactError).toString(),
                  surveyName,
                  analyzerName,
                  existingQuestionLabel,
                  existingOptionLabel,
                  existingCategory,
                  newValue.toString(),
                  'cannot overwrite',
                  existingValue.toString(),
                );
              });
            });
          });

          describe(`when adding a value for multiple categories`, () => {
            describe(`when all the categories exist`, () => {
              describe(`when none of the categories has a value yet`, () => {
                const valuesByCategory = {
                  red: 1,
                  white: 2,
                  yellow: 3,
                  black: 4,
                };

                it(`should add all values for the given option`, () => {
                  const result = targetSurvey.addValueForOption({
                    analyzerName,
                    questionLabel: targetQuestionLabel,
                    optionLabel: targetOptionLabel,
                    valuesByCategory,
                  });

                  expect(result).toBeInstanceOf(Survey);

                  const updated = result as Survey;

                  expect(
                    updated.analyzersByName.get(analyzerName)?.getValueFor({
                      questionLabel: targetQuestionLabel,
                      optionLabel: targetOptionLabel,
                      category: 'red',
                    }),
                  ).toBe(1);

                  expect(
                    updated.analyzersByName.get(analyzerName)?.getValueFor({
                      questionLabel: targetQuestionLabel,
                      optionLabel: targetOptionLabel,
                      category: 'white',
                    }),
                  ).toBe(2);

                  expect(
                    updated.analyzersByName.get(analyzerName)?.getValueFor({
                      questionLabel: targetQuestionLabel,
                      optionLabel: targetOptionLabel,
                      category: 'yellow',
                    }),
                  ).toBe(3);

                  expect(
                    updated.analyzersByName.get(analyzerName)?.getValueFor({
                      questionLabel: targetQuestionLabel,
                      optionLabel: targetOptionLabel,
                      category: 'black',
                    }),
                  ).toBe(4);
                });
              });

              describe(`when one of the categories already has a value`, () => {
                it(`should return the expected error`, () => {
                  const questionWithExistingValue = '1';
                  const optionWithExistingValue = 'a';
                  const categoryWithExistingValue = 'white';
                  const newValue = 5;

                  const result = targetSurvey.addValueForOption({
                    analyzerName,
                    questionLabel: questionWithExistingValue,
                    optionLabel: optionWithExistingValue,
                    valuesByCategory: {
                      [categoryWithExistingValue]: newValue,
                    },
                  });

                  expect(result).toBeInstanceOf(TrueImpactError);

                  assertTextMatchesAll(
                    (result as TrueImpactError).toString(),
                    surveyName,
                    questionWithExistingValue,
                    optionWithExistingValue,
                    categoryWithExistingValue,
                    newValue.toString(),
                    existingValue.toString(),
                  );
                });
              });
            });

            describe(`when one of the categories does not exist`, () => {
              const missingCategory = 'blue';
              const valueForMissingCategory = 12;

              it(`should return the expected error`, () => {
                const result = targetSurvey.addValueForOption({
                  analyzerName,
                  questionLabel: targetQuestionLabel,
                  optionLabel: targetOptionLabel,
                  valuesByCategory: {
                    [missingCategory]: 12,
                  },
                });

                expect(result).toBeInstanceOf(TrueImpactError);

                assertTextMatchesAll(
                  (result as TrueImpactError).toString(),
                  surveyName,
                  targetQuestionLabel,
                  targetOptionLabel,
                  missingCategory,
                  valueForMissingCategory.toString(),
                  'no such category',
                  analyzerName,
                );
              });
            });
          });
        });
      });

      describe(`when the target option does not exist`, () => {
        it(`should return the expected error`, () => {
          const missingOptionLabel = '1b';

          const failedNewValue = 1;

          const result = targetSurvey.addValueForOption({
            analyzerName,
            questionLabel: targetQuestionLabel,
            optionLabel: missingOptionLabel,
            valuesByCategory: {
              [targetCategory]: failedNewValue,
            },
          });

          expect(result).toBeInstanceOf(TrueImpactError);

          assertTextMatchesAll(
            (result as TrueImpactError).toString(),
            surveyName,
            analyzerName,
            targetQuestionLabel,
            missingOptionLabel,
            failedNewValue.toString(),
            'no such option',
          );
        });
      });
    });

    describe(`when the target question does not exist`, () => {
      it(`should return the expected error`, () => {
        const missingQuestionLabel = '67';

        const failedNewValue = 2;

        const result = targetSurvey.addValueForOption({
          analyzerName,
          questionLabel: missingQuestionLabel,
          optionLabel: 'a',
          valuesByCategory: {
            [targetCategory]: failedNewValue,
          },
        });

        expect(result).toBeInstanceOf(TrueImpactError);

        assertTextMatchesAll(
          (result as TrueImpactError).toString(),
          surveyName,
          analyzerName,
          missingQuestionLabel,
        );
      });
    });
  });

  describe(`when the target analyzer does not exist`, () => {
    const bogusAnalyzerName = 'Richter Scale';

    it(`should return the expected error`, () => {
      const result = targetSurvey.addValueForOption({
        analyzerName: bogusAnalyzerName,
        questionLabel: targetQuestionLabel,
        optionLabel: targetOptionLabel,
        valuesByCategory: {
          [targetCategory]: 1,
        },
      });

      expect(result).toBeInstanceOf(TrueImpactError);

      assertTextMatchesAll(
        (result as TrueImpactError).toString(),
        bogusAnalyzerName,
        surveyName,
        targetQuestionLabel,
        targetOptionLabel,
      );
    });
  });
});
