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
import { FinalizeSurvey } from '../../../features/survey/survey-management/commands/finalize-survey.command';
import { OpenSurveyToAnonymousIndividual } from '../../../features/survey/survey-management/commands/open-survey-to-anonymous-individual.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
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

const surveyResponseRecordIndexEndpoint = `${surveyIndexEndpoint}/responses`;

const surveyCompletionCommandsEndpoint = `${surveyIndexEndpoint}/commands`;

const surveyTestSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const surveyCompletionTestSetupEndpoint = `${surveyResponseRecordIndexEndpoint}/test-setup`;

const surveyName = 'My Questionnaire';

const targetQuestionLabel = 'q1';

const targetOptionLabel = 'b';

const buildAndFinalizeSurveyPriorToOpenning = TestCommandStream.first(
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
  .andThen(FinalizeSurvey);

const clientOrigin = 'http://localhost:4200';

/**
 * We need to support cookie management with axios \ RestCommandExecutor in order
 * to test this via direct HTTP requests to the server without a browser. We do have
 * robust automated browser e2e tests of these scenarios with webdriver.io.
 */
describe(`Survey Completion Scenarios: Anonymous Individual Participant`, () => {
  let surveyId: string;

  const adminHttpClient = new TestHttpClient(clientOrigin);

  beforeAll(async () => {
    await signInAsAdmin(adminHttpClient);
  });

  beforeEach(async () => {
    // clear all test data between runs
    await adminHttpClient.patch(surveyCompletionTestSetupEndpoint);

    await adminHttpClient.patch(surveyTestSetupEndpoint);
  });

  describe(`when an admin has opened the survey for anonymous completion`, () => {
    let accessCodeToBeginSurvey: string;

    beforeEach(async () => {
      await assertCommandScenarioSuccess({
        // an admin must build the survey before it can be completed by an anonymous user in possession of an access code
        httpClient: adminHttpClient,
        endpoint: surveyCompletionCommandsEndpoint,
        stream: buildAndFinalizeSurveyPriorToOpenning.andThen(
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

    /**
     * Valid cases are covered by our automated UX tests with webdriver.io.
     */
    describe(`when the user has a valid access code`, () => {
      it(`should begin the survey`, async () => {
        await assertCommandScenarioSuccess({
          httpClient: new TestHttpClient(clientOrigin),
          endpoint: surveyCompletionCommandsEndpoint,
          // we need to append the one-time passcode to headers
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: accessCodeToBeginSurvey,
          }),

          // assertSuccess: (_acks) => {
          //   // TODO check for a cookie
          //   expect(1).toBe('Check for the cookie already!');
          // },
        });
      });
    });

    describe(`when an invalid access code is provided`, () => {
      it(`should return not found (for obscurity)`, async () => {
        await assertCommandScenarioError({
          httpClient: new TestHttpClient(clientOrigin),
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: 'Invalid access code from user',
          }),
          // can we validate the status code?
          assertErrorMessageAsExpected: (message) => {
            expect(message).toBe('Forbidden');
          },
        });
      });
    });

    describe(`when an expired access code is provided`, () => {
      // we'll need to do some magic to set this up
      // TODO finish this test case off before going to prod.
      it.todo(`should return unauthorized`);
    });

    describe(`when the survey has already been started`, () => {
      const anonymousUserHttpClient = new TestHttpClient(clientOrigin);

      beforeEach(async () => {
        await assertCommandScenarioSuccess({
          httpClient: anonymousUserHttpClient,
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: accessCodeToBeginSurvey,
          }),
        });
      });

      /**
       * If a user tries to begin a survey a second time with the same access code,
       * the access code will no longer work. The server will see the BEGIN_SURVEY
       * command, remove the `subject` from the cookie, and attempt to start the
       * survey with the stale access code.
       */
      it(`should return Forbidden`, async () => {
        await assertCommandScenarioError({
          httpClient: anonymousUserHttpClient,
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginSurvey, {
            surveyId,
            accessCode: accessCodeToBeginSurvey,
          }),
          assertErrorMessageAsExpected: (message) => {
            expect(message).toBe('Forbidden');
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
            /**
             * Submitting a survey has the side-effect of logging
             * the (anonymous) client out.
             *
             * TODO Can we test what happens if the browser some how
             * fails to clear the cookie?
             */
            expect(message).toContain('Forbidden');
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
            expect(message).toContain('Forbidden');
          },
        });
      });
    });
  });

  describe(`when the survey has not been opened for completion`, () => {
    beforeEach(async () => {
      await assertCommandScenarioSuccess({
        httpClient: adminHttpClient,
        endpoint: surveyCompletionCommandsEndpoint,
        stream: buildAndFinalizeSurveyPriorToOpenning,
      });

      const surveys = (await axios.get(surveyIndexEndpoint))
        .data as SurveyViewModel[];

      // This survey is finalized, but not yet open for user completion. No access codes are available.
      surveyId = surveys[0].id;
    });

    it(`should return not found (for obscurity)`, async () => {
      await assertCommandScenarioError({
        httpClient: new TestHttpClient(clientOrigin),
        endpoint: surveyCompletionCommandsEndpoint,
        stream: TestCommandStream.first(BeginSurvey, {
          surveyId,
          accessCode: 'BOGUS ACCESS CODE',
        }),
        assertErrorMessageAsExpected: (message) => {
          expect(message).toBe('Forbidden');
        },
      });
    });
  });
});
