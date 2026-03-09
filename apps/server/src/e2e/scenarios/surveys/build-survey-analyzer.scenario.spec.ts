import axios from 'axios';
import { SurveyViewModelClientDto } from '../../../features/survey/queries/survey.view-model';
import {
  AddCategoryToSurveyAnalyzer,
  AddValueForSurveyOption,
  CreateAnalyzer,
} from '../../../features/survey/survey-analysis';
import { AddOptionToSurveyQuestion } from '../../../features/survey/survey-management/commands/add-option-to-survey-question.command';
import { AddQuestionToSurvey } from '../../../features/survey/survey-management/commands/add-question-to-survey.command';
import { CreateSurvey } from '../../../features/survey/survey-management/commands/create-survey.command';
import { PublishSurvey } from '../../../features/survey/survey-management/commands/publish-survey.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertScenarioSuccess } from '../utils';

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const surveyCompletionCommandsEndpoint = `${surveyIndexEndpoint}/commands`;

// const surveyAnalysisEndpoint = `${surveyIndexEndpoint}/analysis`;

const surveyTestSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const createSurvey = TestCommandStream.first(CreateSurvey, {});

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
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: targetQuestion,
    optionLabel: targetOption,
  });

// should we prevent adding an analyzer to a survey that is not yet published?
const publishSurvey = addOptionToSurvey.andThen(PublishSurvey);

const createAnalyzer = publishSurvey.andThen(CreateAnalyzer, {
  name: analyzerName,
});

const addCategoryForAnalyzer = createAnalyzer.andThen(
  AddCategoryToSurveyAnalyzer,
  {
    category,
  },
);

const addValueForOption = addCategoryForAnalyzer.andThen(
  AddValueForSurveyOption,
  {
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
          it.todo(`should return the expected error resposne`);
        });

        describe(`when the new analyzer name is unique`, () => {
          it.todo(`should add the analyzer`);
        });
      });

      describe(`when the survey has no analyzers`, () => {
        it.todo(`should add the analyzer`);
      });
    });

    describe(`when the survey does not exist`, () => {
      it.todo(`should return the expected error response`);
    });
  });

  describe(`when adding a category to an analyzer`, () => {
    describe(`when the survey exists`, () => {
      describe(`when the analyzer exists`, () => {
        describe(`when the analyzer has no categories`, () => {
          it.todo(`should add the first category`);
        });

        describe(`when the analyzer already has categories`, () => {
          describe(`when the new category is unique`, () => {
            it.todo(`should add an additional category`);
          });

          describe(`when the new category name conflicts with an existing name`, () => {
            it.todo(`should return the expected error response`);
          });
        });
      });

      describe(`when the analyzer does not exist`, () => {
        it.todo(`should return the expected error response`);
      });
    });

    describe(`when the survey does not exist`, () => {
      it.todo(`should return the expected error response`);
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
                  await assertScenarioSuccess({
                    endpoint: surveyCompletionCommandsEndpoint,
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
                    },
                  });
                });
              });

              describe(`when one of the values is invalid`, () => {
                describe(`because one of the categories already has a value for the given option`, () => {
                  it.todo(`should return the expected error response`);
                });

                describe(`because one of the values is negative`, () => {
                  it.todo(`should return the expected error response`);
                });
              });
            });

            describe(`when one of the categories does not exist`, () => {
              it.todo(`should return the expected error response`);
            });
          });

          describe(`when the analyzer does not exist`, () => {
            it.todo(`should return the expected error response`);
          });
        });

        describe(`when the target option does not exist`, () => {
          it.todo(`should return the expected error response`);
        });
      });

      describe(`when the target question does not exist`, () => {
        it.todo(`should return the expected error response`);
      });
    });

    describe(`when the survey does not exist`, () => {
      it.todo(`should return the expected error response`);
    });
  });
});
