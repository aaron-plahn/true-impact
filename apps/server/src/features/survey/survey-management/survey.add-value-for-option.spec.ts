import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  CategoryAddedToSurveyAnalyzer,
  SurveyAnalyzerCreated,
  ValueAddedForSurveyOption,
} from '../survey-analysis';
import {
  FollowUpQuestionAddedForSurveyOption,
  OptionAddedToSurveyQuestion,
  QuestionAddedToSurvey,
} from './commands';
import { SurveyCreated } from './events';
import { Survey } from './survey.aggregate-root';

const surveyName = 'Staff Evaluation';

const analyzerName = 'medicine wheel';

const existingValue = 7;

// TODO introduce `TestEventStream`
const aggregateCompositeIdentifier = {
  id: '123',
};

const targetSurvey = Survey.fromEventHistory([
  buildTestInstance(SurveyCreated, {
    payload: {
      aggregateCompositeIdentifier,
      name: surveyName,
    },
  }),
  buildTestInstance(QuestionAddedToSurvey, {
    payload: {
      aggregateCompositeIdentifier,
      label: '1',
      prompt: 'Would you like to see question 2?',
    },
  }),
  buildTestInstance(OptionAddedToSurveyQuestion, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '1',
      optionLabel: 'b',
      text: 'no',
    },
  }),
  buildTestInstance(OptionAddedToSurveyQuestion, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '1',
      optionLabel: 'a',
      text: 'yes',
    },
  }),
  buildTestInstance(FollowUpQuestionAddedForSurveyOption, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '1',
      optionLabel: 'a',
      followUpQuestionLabel: '2',
      followUpQuestionPrompt: 'Do you like question 2?',
    },
  }),
  buildTestInstance(OptionAddedToSurveyQuestion, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '2',
      optionLabel: 'a',
      text: 'yes',
    },
  }),
  buildTestInstance(OptionAddedToSurveyQuestion, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '2',
      optionLabel: 'b',
      text: 'no',
    },
  }),
  buildTestInstance(OptionAddedToSurveyQuestion, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '2',
      optionLabel: 'c',
      text: 'maybe so',
    },
  }),
  buildTestInstance(QuestionAddedToSurvey, {
    payload: {
      aggregateCompositeIdentifier,
      label: '3',
      prompt: 'Will you take my survey again some day?',
    },
  }),
  buildTestInstance(OptionAddedToSurveyQuestion, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '3',
      optionLabel: 'a',
      text: 'yes',
    },
  }),
  buildTestInstance(OptionAddedToSurveyQuestion, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '3',
      optionLabel: 'b',
      text: 'no',
    },
  }),
  buildTestInstance(OptionAddedToSurveyQuestion, {
    payload: {
      aggregateCompositeIdentifier,
      questionLabel: '3',
      optionLabel: 'c',
      text: 'maybe so',
    },
  }),
  buildTestInstance(SurveyAnalyzerCreated, {
    payload: {
      aggregateCompositeIdentifier,
      name: analyzerName,
    },
  }),
  buildTestInstance(CategoryAddedToSurveyAnalyzer, {
    payload: {
      aggregateCompositeIdentifier,
      analyzerName,
      category: 'red',
    },
  }),
  buildTestInstance(CategoryAddedToSurveyAnalyzer, {
    payload: {
      aggregateCompositeIdentifier,
      analyzerName,
      category: 'white',
    },
  }),
  buildTestInstance(CategoryAddedToSurveyAnalyzer, {
    payload: {
      aggregateCompositeIdentifier,
      analyzerName,
      category: 'yellow',
    },
  }),
  buildTestInstance(CategoryAddedToSurveyAnalyzer, {
    payload: {
      aggregateCompositeIdentifier,
      analyzerName,
      category: 'black',
    },
  }),
  buildTestInstance(ValueAddedForSurveyOption, {
    payload: {
      aggregateCompositeIdentifier,
      analyzerName,
      questionLabel: '1',
      optionLabel: 'a',
      valuesByCategory: {
        white: existingValue,
      },
    },
  }),
  buildTestInstance(ValueAddedForSurveyOption, {
    payload: {
      aggregateCompositeIdentifier,
      analyzerName,
      questionLabel: '1',
      optionLabel: 'b',
      valuesByCategory: {
        yellow: 1,
      },
    },
  }),
  buildTestInstance(ValueAddedForSurveyOption, {
    payload: {
      aggregateCompositeIdentifier,
      analyzerName,
      questionLabel: '2',
      optionLabel: 'a',
      valuesByCategory: {
        white: 1,
      },
    },
  }),
  buildTestInstance(ValueAddedForSurveyOption, {
    payload: {
      aggregateCompositeIdentifier,
      analyzerName,
      questionLabel: '2',
      optionLabel: 'b',
      valuesByCategory: {
        yellow: 1,
      },
    },
  }),
  // 2(c) has no values to start
  // c: {
  //   red: 1,
  // },
  // },
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
]) as Survey;

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
                  const result = targetSurvey.addValuesForOption({
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

                  const result = targetSurvey.addValuesForOption({
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
                const result = targetSurvey.addValuesForOption({
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
                  const result = targetSurvey.addValuesForOption({
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

                  const result = targetSurvey.addValuesForOption({
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
                const result = targetSurvey.addValuesForOption({
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

          const result = targetSurvey.addValuesForOption({
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

        const result = targetSurvey.addValuesForOption({
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
      const result = targetSurvey.addValuesForOption({
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
