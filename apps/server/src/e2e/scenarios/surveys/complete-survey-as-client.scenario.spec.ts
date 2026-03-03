import axios from 'axios';
import { SurveyViewModel } from 'src/features/survey/queries/survey.view-model';
import { CLIENT_AGGREGATE_TYPE } from '../../../features/clients/client.composite-identifier';
import { CreateClient } from '../../../features/clients/commands/create-client.command';
import { BeginSurvey } from '../../../features/survey/survey-completion';
import { AddOptionToSurveyQuestion } from '../../../features/survey/survey-management/commands/add-option-to-survey-question.command';
import { AddQuestionToSurvey } from '../../../features/survey/survey-management/commands/add-question-to-survey.command';
import { CreateSurvey } from '../../../features/survey/survey-management/commands/create-survey.command';
import { PublishSurvey } from '../../../features/survey/survey-management/commands/publish-survey.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
import {
  assertCommandStreamError,
  assertQueryResponse,
  assertScenarioSuccess,
} from '../utils';

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

// TODO use this where applicable
const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const surveyResponseRecordIndexEndpoint = `${baseEndpoint}/surveys/responses`;

const surveyCompletionCommandsEndpoint = `${baseEndpoint}/surveys/commands`;

const clientBaseEndpoint = `${baseEndpoint}/clients`;

const clientCommandsEndpoint = `${clientBaseEndpoint}/commands`;

const clientTestSetupEndpoint = `${clientBaseEndpoint}/test-setup`;

const surveyTestSetupEndpoint = `${baseEndpoint}/surveys/test-setup`;

const surveyCompletionTestSetupEndpoint = `${surveyResponseRecordIndexEndpoint}/test-setup`;

const createClient = TestCommandStream.first(CreateClient, {});

let clientId: string;

// Do we ensure this is unique?
const surveyName = 'My Questionnaire';

const publishSurvey = TestCommandStream.first(CreateSurvey, {
  name: surveyName,
})
  .andThen(AddQuestionToSurvey, {
    label: 'q1',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q1',
    optionLabel: 'a',
    text: 'yes',
  })
  .andThen(AddOptionToSurveyQuestion, {
    questionLabel: 'q1',
    optionLabel: 'b',
    text: 'no',
  })
  .andThen(PublishSurvey);

const seedTestClient = async () => {
  // TODO rename helpers and params
  await assertScenarioSuccess({
    endpoint: clientCommandsEndpoint,
    stream: createClient,
    // onSuccess?
    assertSuccess: (acks) => {
      expect(acks).toHaveLength(1);

      clientId = acks[0].id;
    },
  });
};

const seedTestSurvey = async () => {
  await assertScenarioSuccess({
    endpoint: surveyCompletionCommandsEndpoint,
    stream: publishSurvey,
    assertSuccess: (acks) => {
      expect(acks).toHaveLength(publishSurvey.size());
    },
  });
};

describe(`Survey Completion Scenarios`, () => {
  beforeAll(async () => {
    await axios.patch(clientTestSetupEndpoint);
  });

  beforeEach(async () => {
    await axios.patch(surveyCompletionTestSetupEndpoint);

    await axios.patch(surveyTestSetupEndpoint);

    await seedTestClient();

    await seedTestSurvey();
  });

  describe(`when executing a scenario`, () => {
    describe(`when the scenario is valid`, () => {
      describe(`when completing the survey for the first time`, () => {
        it.todo(`should have a comprehensive survey completion scenario`);
      });

      describe(`when completing the survey for an additional time`, () => {
        it.todo(`should add a complete, second survey completion record`);
      });
    });

    describe(`when the scenario is invalid`, () => {
      describe(`when beginning a survey`, () => {
        describe(`when the target survey does not exist`, () => {
          it(`should return the expected error response`, async () => {
            let surveyId: string;

            await assertQueryResponse({
              endpoint: surveyIndexEndpoint,
              assertResponseBody: (body: SurveyViewModel[]) => {
                surveyId = body[0].id;
              },
            });

            const beginSurvey = TestCommandStream.first(BeginSurvey, {
              participantCompositeIdentifier: {
                type: CLIENT_AGGREGATE_TYPE,
                id: clientId,
              },
              // @ts-expect-error there's gotta be a better way to handle this
              surveyId,
            });

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: beginSurvey,
              assertErrorMessageAsExpected: (message: string) => {
                // TODO assertTextIncludesAllPatterns
                expect(message).toContain('fiddlesticks bobbio!');
              },
            });
          });
        });

        describe(`when the target survey is not published`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the survey participant is not of type client`, () => {
          it.todo(`should fail with the expected error response`);
        });

        describe(`when the survey participant is a client`, () => {
          describe(`when the client does not exist`, () => {
            it.todo(`should fail with the expected error response`);
          });
        });
      });

      describe(`when responding to a top-level survey question`, () => {
        describe(`when the survey completion record does not exist`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when there is no question with the given label`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the question already has a response`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the question is not next in line`, () => {
          it.todo(`should return the expected error response`);
        });
      });

      describe(`when responding to a follow-up survey question`, () => {
        describe(`when the survey completion record does not exist`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when there is no question with the given label`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the question already has a response`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the question is not next in line`, () => {
          it.todo(`should return the expected error resposne`);
        });

        describe(`when the follow-up question should not have been asked based on the parent question's response`, () => {
          it.todo(`should return the expected error response`);
        });
      });

      describe(`when abandoning a survey`, () => {
        describe(`when the survey completion record does not exist`, () => {
          it.todo(`should return the expected error response`);
        });

        // TODO survey response instead of completion record?
        describe(`when the draft survey completion record has already been abandoned`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the survey completion record has already been submitted`, () => {
          it.todo(`should return the expected error response`);
        });
      });
    });
  });
});
