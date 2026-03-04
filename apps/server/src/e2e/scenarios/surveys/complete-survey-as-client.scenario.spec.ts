import axios from 'axios';
import { Client } from '../../../features/clients/client.aggregate-root';
import { CLIENT_AGGREGATE_TYPE } from '../../../features/clients/client.composite-identifier';
import { CreateClient } from '../../../features/clients/commands/create-client.command';
import { SurveyViewModel } from '../../../features/survey/queries/survey.view-model';
import {
  AbandonSurveyCompletion,
  AnswerSurveyQuestion,
  BeginSurvey,
  SubmitSurvey,
} from '../../../features/survey/survey-completion';
import { SurveyResponseRecordViewModel } from '../../../features/survey/survey-completion/queries/survey-response-record.view-model';
import { AddFollowUpQuestionForSurveyOption } from '../../../features/survey/survey-management/commands/add-follow-up-question-for-survey-option.command';
import { AddOptionToSurveyQuestion } from '../../../features/survey/survey-management/commands/add-option-to-survey-question.command';
import { AddQuestionToSurvey } from '../../../features/survey/survey-management/commands/add-question-to-survey.command';
import { CreateSurvey } from '../../../features/survey/survey-management/commands/create-survey.command';
import { PublishSurvey } from '../../../features/survey/survey-management/commands/publish-survey.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandStreamError,
  assertQueryResponse,
  assertScenarioSuccess,
} from '../utils';

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const surveyResponseRecordIndexEndpoint = `${surveyIndexEndpoint}/responses`;

const surveyCompletionCommandsEndpoint = `${surveyIndexEndpoint}/commands`;

const clientBaseEndpoint = `${baseEndpoint}/clients`;

const clientCommandsEndpoint = `${clientBaseEndpoint}/commands`;

const clientTestSetupEndpoint = `${clientBaseEndpoint}/test-setup`;

const surveyTestSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const surveyCompletionTestSetupEndpoint = `${surveyResponseRecordIndexEndpoint}/test-setup`;

const createClient = TestCommandStream.first(CreateClient, {});

let clientId: string;

const surveyName = 'My Questionnaire';

const targetQuestionLabel = 'q1';

const targetOptionLabel = 'b';

const buildFullSurveyBeforePublishing = TestCommandStream.first(CreateSurvey, {
  name: surveyName,
})
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
  });

const publishSurvey = buildFullSurveyBeforePublishing.andThen(PublishSurvey);

const seedTestClient = async () => {
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

const seedPublishedSurvey = async () => {
  await assertScenarioSuccess({
    endpoint: surveyCompletionCommandsEndpoint,
    stream: publishSurvey,
  });
};

describe(`Survey Completion Scenarios`, () => {
  beforeEach(async () => {
    // clear all test data between runs
    await axios.patch(surveyCompletionTestSetupEndpoint);

    await axios.patch(surveyTestSetupEndpoint);

    await axios.patch(clientTestSetupEndpoint);

    await seedTestClient();
  });

  describe(`when executing a scenario`, () => {
    describe(`when the scenario is valid`, () => {
      describe(`when completing the survey for the first time`, () => {
        beforeEach(async () => {
          await seedPublishedSurvey();
        });

        it(`should submit the survey completion attempt`, async () => {
          const { id: clientId } = (
            (await axios.get(clientBaseEndpoint)).data as Client[]
          )[0];

          const { id: surveyId } = (
            (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
          )[0];

          await assertScenarioSuccess({
            endpoint: surveyCompletionCommandsEndpoint,
            stream: TestCommandStream.first(BeginSurvey, {
              surveyId,
              participantCompositeIdentifier: {
                id: clientId,
                type: CLIENT_AGGREGATE_TYPE,
              },
            })
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
                chosenOptionLabel: 'a',
              })
              .andThen(AnswerSurveyQuestion, {
                questionLabel: 'q3',
                chosenOptionLabel: 'b',
              })
              .andThen(SubmitSurvey, {}),
            assertSuccess: async (acks) => {
              await assertQueryResponse({
                endpoint: `${surveyResponseRecordIndexEndpoint}/${acks[0].id}`,
                assertResponseBody: (body: SurveyResponseRecordViewModel) => {
                  expect(body.hasBeenSubmitted).toBe(true);
                },
              });
            },
          });
        });
      });

      describe(`when completing the survey for an additional time`, () => {
        beforeEach(async () => {
          await seedPublishedSurvey();
        });

        it(`should add a complete, second survey completion record`, async () => {
          const { id: clientId } = (
            (await axios.get(clientBaseEndpoint)).data as Client[]
          )[0];

          const { id: surveyId } = (
            (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
          )[0];

          await assertScenarioSuccess({
            endpoint: surveyCompletionCommandsEndpoint,
            stream: TestCommandStream.first(BeginSurvey, {
              surveyId,
              participantCompositeIdentifier: {
                id: clientId,
                type: CLIENT_AGGREGATE_TYPE,
              },
            })
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
                chosenOptionLabel: 'a',
              })
              .andThen(AnswerSurveyQuestion, {
                questionLabel: 'q3',
                chosenOptionLabel: 'b',
              })
              .andThen(SubmitSurvey, {}),
            assertSuccess: async (acks) => {
              await assertQueryResponse({
                endpoint: `${surveyResponseRecordIndexEndpoint}/${acks[0].id}`,
                assertResponseBody: (body: SurveyResponseRecordViewModel) => {
                  expect(body.hasBeenSubmitted).toBe(true);
                },
              });
            },
          });

          await assertScenarioSuccess({
            endpoint: surveyCompletionCommandsEndpoint,
            stream: TestCommandStream.first(BeginSurvey, {
              surveyId,
              participantCompositeIdentifier: {
                id: clientId,
                type: CLIENT_AGGREGATE_TYPE,
              },
            })
              .andThen(AnswerSurveyQuestion, {
                questionLabel: 'q1',
                chosenOptionLabel: 'a',
              })
              .andThen(AnswerSurveyQuestion, {
                questionLabel: 'q2',
                chosenOptionLabel: 'a',
              })
              .andThen(AnswerSurveyQuestion, {
                questionLabel: 'q3',
                chosenOptionLabel: 'c',
              })
              .andThen(SubmitSurvey, {}),
            assertSuccess: async (acks) => {
              await assertQueryResponse({
                endpoint: `${surveyResponseRecordIndexEndpoint}/${acks[0].id}`,
                assertResponseBody: (body: SurveyResponseRecordViewModel) => {
                  expect(body.hasBeenSubmitted).toBe(true);
                },
              });
            },
          });
        });
      });
    });

    describe(`when the scenario is invalid`, () => {
      describe(`when beginning a survey`, () => {
        describe(`when the participant already has attempt in progress for this survey`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            await assertScenarioSuccess({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              }).andThen(AnswerSurveyQuestion, {
                questionLabel: targetQuestionLabel,
                chosenOptionLabel: targetOptionLabel,
              }),
            });

            await assertCommandError({
              endpoint: surveyCompletionCommandsEndpoint,
              commandFsa: TestCommandStream.buildOne(BeginSurvey, {
                // SAME survey as the one in progress
                surveyId,
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  clientId,
                  'in progress',
                );
              },
            });
          });
        });

        describe(`when the target survey does not exist`, () => {
          it(`should return the expected error response`, async () => {
            const missingSurveyId = '404';

            const beginSurvey = TestCommandStream.first(BeginSurvey, {
              participantCompositeIdentifier: {
                type: CLIENT_AGGREGATE_TYPE,
                id: clientId,
              },
              surveyId: missingSurveyId,
            });

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: beginSurvey,
              assertErrorMessageAsExpected: (message: string) => {
                assertTextMatchesAll(
                  message,
                  missingSurveyId,
                  'cannot begin survey',
                );
              },
            });
          });
        });

        describe(`when the target survey is not published`, () => {
          it(`should return the expected error response`, async () => {
            await assertScenarioSuccess({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: buildFullSurveyBeforePublishing,
            });

            /**
             * A better way to do this is to expose a `fetchOneByName` endpoint.
             */
            // Do we want a helper to hide the cast- or can we use a generic on the .get?
            const response = await axios.get(surveyIndexEndpoint);

            const body = response.data as SurveyViewModel[];

            const { id: surveyId } = body[0];

            const beginSurvey = TestCommandStream.first(BeginSurvey, {
              participantCompositeIdentifier: {
                type: CLIENT_AGGREGATE_TYPE,
                id: clientId,
              },
              surveyId,
            });

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: beginSurvey,
            });
          });
        });

        describe(`when the survey participant is not of type client`, () => {
          const invalidParticipantType = 'reporter';

          const invalidParticipantId = '456';

          it(`should fail with the expected error response`, async () => {
            let surveyId: string;

            await assertScenarioSuccess({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: publishSurvey,
              assertSuccess: (acks) => {
                surveyId = acks[0].id;
              },
            });

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                // @ts-expect-error The compiler doesn't realize our callback has a side effect
                surveyId,
                participantCompositeIdentifier: {
                  type: invalidParticipantType,
                  id: invalidParticipantId,
                },
              }),
            });
          });
        });

        describe(`when the survey participant is a client`, () => {
          describe(`when the client does not exist`, () => {
            it(`should fail with the expected error response`, async () => {
              await assertScenarioSuccess({
                endpoint: surveyCompletionCommandsEndpoint,
                stream: publishSurvey,
              });

              const surveySearchResult = await axios.get(surveyIndexEndpoint);

              const { id: surveyId } = (
                surveySearchResult.data as SurveyViewModel[]
              )[0];

              // const clientSearchResult = await axios.get(clientBaseEndpoint);

              // const { id: clientId } = (clientSearchResult.data as Client[])[0];

              const missingClientId = 'c404';

              const beginSurvey = TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  type: CLIENT_AGGREGATE_TYPE,
                  id: missingClientId,
                },
              });

              await assertCommandStreamError({
                endpoint: surveyCompletionCommandsEndpoint,
                stream: beginSurvey,
                assertErrorMessageAsExpected: (message) => {
                  assertTextMatchesAll(
                    message,
                    CLIENT_AGGREGATE_TYPE,
                    'participant does not exist',
                    missingClientId,
                    surveyName,
                  );
                },
              });
            });
          });
        });
      });

      describe(`when answering a top-level survey question`, () => {
        describe(`when the survey completion record does not exist`, () => {
          it(`should return the expected error response`, async () => {
            const bogusSurveyAttemptId = 'sa404';

            await assertCommandError({
              endpoint: surveyCompletionCommandsEndpoint,
              commandFsa: TestCommandStream.buildOne(AnswerSurveyQuestion, {
                aggregateCompositeIdentifier: {
                  id: bogusSurveyAttemptId,
                },
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(bogusSurveyAttemptId);
                assertTextMatchesAll(message, 'no such attempt in progress');
              },
            });
          });
        });

        describe(`when there is no question with the given label`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            const missingQuestionLabel = 'J7';

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  type: CLIENT_AGGREGATE_TYPE,
                  id: clientId,
                },
              }).andThen(AnswerSurveyQuestion, {
                questionLabel: missingQuestionLabel,
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  missingQuestionLabel,
                  surveyName,
                  'no such question',
                );
              },
            });
          });
        });

        describe(`when the question already has a response`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const repeatedQuestion = targetQuestionLabel;

            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: repeatedQuestion,
                  chosenOptionLabel: targetOptionLabel,
                })
                // repeated attempt to answer this question
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: repeatedQuestion,
                  chosenOptionLabel: targetOptionLabel,
                }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  repeatedQuestion,
                  'been answered',
                  surveyName,
                );
              },
            });
          });
        });

        describe(`when the question is not next in line`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            const outOfOrderQuestionLabel = 'q2';

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              }).andThen(AnswerSurveyQuestion, {
                questionLabel: outOfOrderQuestionLabel,
              }),
            });
          });
        });
      });

      describe(`when responding to a follow-up survey question`, () => {
        describe(`when there is no question with the given label`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const bogusQuestionLabel = '4.';

            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,

                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              }).andThen(AnswerSurveyQuestion, {
                questionLabel: bogusQuestionLabel,
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  bogusQuestionLabel,
                  surveyName,
                  'cannot answer',
                  'no such question',
                );
              },
            });
          });
        });

        describe(`when the question already has a response`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const repeatedQuestion = 'q2.a';

            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: 'q1',
                  chosenOptionLabel: 'a',
                })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: 'q2',
                  chosenOptionLabel: 'b', // this activates the follow-up question
                })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: repeatedQuestion,
                  chosenOptionLabel: targetOptionLabel,
                })
                // repeated attempt to answer this question
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: repeatedQuestion,
                  chosenOptionLabel: targetOptionLabel,
                }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  repeatedQuestion,
                  'been answered',
                  surveyName,
                );
              },
            });
          });
        });

        describe(`when the follow-up question should not have been asked based on the parent question's response`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error resposne`, async () => {
            const conditionallyOmittedQuestionLabel = 'q2.a';

            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: targetQuestionLabel,
                  chosenOptionLabel: targetOptionLabel,
                })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: 'q2',
                  chosenOptionLabel: 'a', // this has no follow-up
                })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: conditionallyOmittedQuestionLabel, // this question should be omitted based on the previous response
                  chosenOptionLabel: 'a',
                }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  conditionallyOmittedQuestionLabel,
                  'not the next question',
                );
              },
            });
          });
        });
      });

      describe(`when abandoning a survey`, () => {
        describe(`when the survey completion record does not exist`, () => {
          it(`should return the expected error response`, async () => {
            const missingSurveyAttemptId = 'sa404-123';

            await assertCommandError({
              endpoint: surveyCompletionCommandsEndpoint,
              commandFsa: TestCommandStream.buildOne(AbandonSurveyCompletion, {
                aggregateCompositeIdentifier: {
                  id: missingSurveyAttemptId,
                },
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  'cannot abandon',
                  missingSurveyAttemptId,
                  'no such attempt',
                );
              },
            });
          });
        });

        // TODO survey response instead of completion record?
        describe(`when the draft survey completion record has already been abandoned`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
                surveyId,
              })
                .andThen(AbandonSurveyCompletion)
                // repeated attempt
                .andThen(AbandonSurveyCompletion),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  'cannot abandon',
                  'already been abandoned',
                );
              },
            });
          });
        });

        describe(`when the survey completion record has already been submitted`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              })
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
                  chosenOptionLabel: 'a',
                })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: 'q3',
                  chosenOptionLabel: 'b',
                })
                .andThen(SubmitSurvey, {})
                .andThen(AbandonSurveyCompletion),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  'cannot abandon',
                  'been submitted',
                );
              },
            });
          });
        });
      });

      describe(`when submitting a survey`, () => {
        describe(`when the survey attempt does not exist`, () => {
          const missingSurveyAttemptId = 'H1234-A';

          it(`should return the expected error response`, async () => {
            await assertCommandError({
              endpoint: surveyCompletionCommandsEndpoint,
              commandFsa: TestCommandStream.buildOne(SubmitSurvey, {
                aggregateCompositeIdentifier: {
                  id: missingSurveyAttemptId,
                },
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  missingSurveyAttemptId,
                  'no such attempt',
                );
              },
            });
          });
        });

        describe(`when the survey attempt is incomplete`, () => {
          beforeEach(async () => {
            await seedPublishedSurvey();
          });

          it(`should return the expected error response`, async () => {
            const { id: clientId } = (
              (await axios.get(clientBaseEndpoint)).data as Client[]
            )[0];

            const { id: surveyId } = (
              (await axios.get(surveyIndexEndpoint)).data as SurveyViewModel[]
            )[0];

            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {
                surveyId,
                participantCompositeIdentifier: {
                  id: clientId,
                  type: CLIENT_AGGREGATE_TYPE,
                },
              })
                .andThen(AnswerSurveyQuestion, {
                  questionLabel: 'q1',
                  chosenOptionLabel: 'a',
                })
                .andThen(SubmitSurvey),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  surveyName,
                  'cannot submit',
                  'not been fully completed',
                );
              },
            });
          });
        });

        describe(`when the survey attempt has already been abandoned`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: surveyCompletionCommandsEndpoint,
              stream: TestCommandStream.first(BeginSurvey, {}).andThen(
                AbandonSurveyCompletion,
              ),
            });
          });
        });
      });
    });
  });
});
