import axios from 'axios';
import { SurveyViewModel } from '../../../features/survey/queries/survey.view-model';
import {
  AnswerSurveyQuestion,
  BeginSurvey,
  SubmitSurvey,
} from '../../../features/survey/survey-completion';
import { AddFollowUpQuestionForSurveyOption } from '../../../features/survey/survey-management/commands/add-follow-up-question-for-survey-option.command';
import { AddOptionToSurveyQuestion } from '../../../features/survey/survey-management/commands/add-option-to-survey-question.command';
import { AddQuestionToSurvey } from '../../../features/survey/survey-management/commands/add-question-to-survey.command';
import { CreateSurvey } from '../../../features/survey/survey-management/commands/create-survey.command';
import { OpenSurveyToAnonymousIndividual } from '../../../features/survey/survey-management/commands/open-survey-to-anonymous-individual.command';
import { PublishSurvey } from '../../../features/survey/survey-management/commands/publish-survey.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
import {
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
} from '../utils';

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const surveyResponseRecordIndexEndpoint = `${surveyIndexEndpoint}/responses`;

const surveyCompletionCommandsEndpoint = `${surveyIndexEndpoint}/commands`;

const surveyTestSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const surveyCompletionTestSetupEndpoint = `${surveyResponseRecordIndexEndpoint}/test-setup`;

const surveyName = 'My Questionnaire';

const targetQuestionLabel = 'q1';

const targetOptionLabel = 'b';

const buildAndPublishSurveyPriorToOpenning = TestCommandStream.first(
  CreateSurvey,
  {
    name: surveyName,
  },
)
  .andThen(AddQuestionToSurvey, {
    label: targetQuestionLabel,
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: targetQuestionLabel,
    optionLabel: 'a',
    text: 'yes',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: targetQuestionLabel,
    optionLabel: targetOptionLabel,
    text: 'no',
  })
  .andThen(AddQuestionToSurvey, {
    label: 'q2',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q2',
    optionLabel: 'a',
    text: 'likely',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q2',
    optionLabel: 'b',
    text: 'unlikely',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q2',
    optionLabel: 'c',
    text: 'never',
  })
  .andThen(AddFollowUpQuestionForSurveyOption, {
    questionLabel: 'q2',
    optionLabel: 'b',
    followUpQuestionPrompt: 'Why do you say so?',
    followUpQuestionLabel: 'q2.a',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q2.a',
    optionLabel: 'a',
    text: 'because',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q2.a',
    optionLabel: 'b',
    text: 'just, because!',
  })
  .andThen(AddQuestionToSurvey, {
    label: 'q3',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q3',
    optionLabel: 'a',
    text: 'good',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q3',
    optionLabel: 'b',
    text: 'bad',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q3',
    optionLabel: 'c',
    text: 'ugly',
  })
  .andThen(PublishSurvey);

describe(`Survey Completion Scenarios: Anonymous Individual Participant`, () => {
  let surveyId: string;
  // let passcodeToBeginSurvey: string;

  beforeEach(async () => {
    // clear all test data between runs
    await axios.patch(surveyCompletionTestSetupEndpoint);

    await axios.patch(surveyTestSetupEndpoint);
  });

  describe(`when an admin has opened the survey for anonymous completion`, () => {
    let accessCodeToBeginSurvey: string;

    beforeEach(async () => {
      await assertCommandScenarioSuccess({
        endpoint: surveyCompletionCommandsEndpoint,
        stream: buildAndPublishSurveyPriorToOpenning.andThen(
          OpenSurveyToAnonymousIndividual,
        ),
        assertSuccess: (acks) => {
          const last = acks.at(-1);

          expect(last?.accessCode).toBeTruthy();

          accessCodeToBeginSurvey = last?.accessCode as string;
        },
      });

      const surveys = (await axios.get(surveyIndexEndpoint))
        .data as SurveyViewModel[];

      surveyId = surveys[0].id;
    });

    describe(`when the user has a valid access code`, () => {
      it(`should begin the survey`, async () => {
        await assertCommandScenarioSuccess({
          endpoint: surveyCompletionCommandsEndpoint,
          // we need to append the one-time passcode to headers
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: accessCodeToBeginSurvey,
          }),

          assertSuccess: (acks) => {
            const { accessCode } = acks[0];

            expect(accessCode).toBeTruthy();
          },
        });
      });
    });

    describe(`when an invalid access code is provided`, () => {
      it(`should return not found (for obscurity)`, async () => {
        await assertCommandScenarioError({
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: 'Invalid access code from user',
          }),
          // can we validate the status code?
          assertErrorMessageAsExpected: (message) => {
            expect(message).toBe('Not Found');
          },
        });
      });
    });

    describe(`when an expired access code is provided`, () => {
      // we'll need to do some magic to set this up
      it.todo(`should return unauthorized`);
    });

    describe(`when the survey has already been started`, () => {
      beforeEach(async () => {
        await assertCommandScenarioSuccess({
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: accessCodeToBeginSurvey,
          }),
        });
      });

      it(`should return Not Found`, async () => {
        await assertCommandScenarioError({
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: accessCodeToBeginSurvey,
          }),
          assertErrorMessageAsExpected: (message) => {
            expect(message).toBe('Not Found');
          },
        });
      });
    });

    describe(`when the survey has already been completed`, () => {
      it(`should return the expected error`, async () => {
        await assertCommandScenarioError({
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: accessCodeToBeginSurvey,
          })
            // TODO The cookie with the access code should be set for each request
            .andThen(AnswerSurveyQuestion, {
              questionLabel: 'q1',
              chosenOptionLabel: 'a',
            })
            .andThen(AnswerSurveyQuestion, {
              questionLabel: 'q2',
              chosenOptionLabel: 'b',
            })
            .andThen(AnswerSurveyQuestion, {
              questionLabel: 'q2.a',
              chosenOptionLabel: 'b',
            })
            .andThen(AnswerSurveyQuestion, {
              questionLabel: 'q3',
              chosenOptionLabel: 'a',
            })
            .andThen(SubmitSurvey, {})
            .andThen(AnswerSurveyQuestion, {
              questionLabel: 'q4',
              chosenOptionLabel: 'a',
            }),
          assertErrorMessageAsExpected: (message) => {
            expect(message).toContain('has already been submitted');
          },
        });
      });
    });

    describe(`when no access code is provided`, () => {
      it(`should return not found (for obscurity)`, async () => {
        await assertCommandScenarioError({
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: undefined,
          }),
          assertErrorMessageAsExpected: (message) => {
            expect(message).toBe('Not Found');
          },
        });
      });
    });
  });

  describe(`when the survey has not been opened for completion`, () => {
    beforeEach(async () => {
      await assertCommandScenarioSuccess({
        endpoint: surveyCompletionCommandsEndpoint,
        stream: buildAndPublishSurveyPriorToOpenning,
      });

      const surveys = (await axios.get(surveyIndexEndpoint))
        .data as SurveyViewModel[];

      // This survey is published (Finalized) but not yet open for user completion. No access codes are available.
      surveyId = surveys[0].id;
    });

    it(`should return not found (for obscurity)`, async () => {
      await assertCommandScenarioError({
        endpoint: surveyCompletionCommandsEndpoint,
        stream: TestCommandStream.first(BeginSurvey, {
          surveyId,
          accessCode: 'BOGUS ACCESS CODE',
        }),
        assertErrorMessageAsExpected: (message) => {
          expect(message).toBe('Not Found');
        },
      });
    });
  });
});
