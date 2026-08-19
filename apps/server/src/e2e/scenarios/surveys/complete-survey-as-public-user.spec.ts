import axios from 'axios';
import { SurveyViewModel } from '../../../features/survey/queries/survey.view-model';
import { BeginPublicSurvey } from '../../../features/survey/survey-completion/commands/begin-public-survey';
import { AddFollowUpQuestionForSurveyOption } from '../../../features/survey/survey-management/commands/add-follow-up-question-for-survey-option.command';
import { AddOptionToSurveyQuestion } from '../../../features/survey/survey-management/commands/add-option-to-survey-question.command';
import { AddQuestionToSurvey } from '../../../features/survey/survey-management/commands/add-question-to-survey.command';
import { CreateSurvey } from '../../../features/survey/survey-management/commands/create-survey.command';
import { FinalizeSurvey } from '../../../features/survey/survey-management/commands/finalize-survey.command';
import { OpenSurveyToPublic } from '../../../features/survey/survey-management/commands/open-survey-to-client/open-survey-to-public.command';
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
describe(`Survey Completion Scenarios: Public Participant (no access code required)`, () => {
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

  describe(`when an admin has opened the survey for public completion`, () => {
    beforeEach(async () => {
      await assertCommandScenarioSuccess({
        // an admin must build the survey before it can be completed by an anonymous user in possession of an access code
        httpClient: adminHttpClient,
        endpoint: surveyCompletionCommandsEndpoint,
        stream:
          buildAndFinalizeSurveyPriorToOpenning.andThen(OpenSurveyToPublic),
      });

      const surveys = (await axios.get(surveyIndexEndpoint))
        .data as SurveyViewModel[];

      surveyId = surveys[0].id;
    });

    /**
     * Complete workflows for valid cases are covered by our automated UX tests with webdriver.io.
     */
    describe(`when the survey is available for public completion`, () => {
      it(`should begin the survey`, async () => {
        await assertCommandScenarioSuccess({
          httpClient: new TestHttpClient(clientOrigin),
          endpoint: surveyCompletionCommandsEndpoint,
          // Do we want a separate `BeginPublicSurvey` command for easy debugging?
          stream: TestCommandStream.first(BeginPublicSurvey, {
            surveyId,
          }),
        });
      });
    });

    describe(`when the survey has already been started`, () => {
      const publicUserHttpClient = new TestHttpClient(clientOrigin);

      beforeEach(async () => {
        await assertCommandScenarioSuccess({
          httpClient: publicUserHttpClient,
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginPublicSurvey, {
            surveyId,
          }),
        });
      });

      it(`should start a second attempt`, async () => {
        await assertCommandScenarioSuccess({
          httpClient: publicUserHttpClient,
          endpoint: surveyCompletionCommandsEndpoint,
          stream: TestCommandStream.first(BeginPublicSurvey, {
            surveyId,
          }),
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
        stream: TestCommandStream.first(BeginPublicSurvey, {
          surveyId,
        }),
        assertErrorMessageAsExpected: (message) => {
          expect(message).toContain('Forbidden');
        },
      });
    });
  });
});
