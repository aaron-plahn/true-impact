import axios, { AxiosResponse } from 'axios';
import { AddFollowUpQuestionForSurveyOption } from '../../../features/survey/commands/add-follow-up-question-for-survey-option.command';
import { AddOptionToSurveyQuestion } from '../../../features/survey/commands/add-option-to-survey-question.command';
import { AddQuestionToSurvey } from '../../../features/survey/commands/add-question-to-survey.command';
import { CreateSurvey } from '../../../features/survey/commands/create-survey.command';
import { PublishSurvey } from '../../../features/survey/commands/publish-survey.command';
import {
  SurveyViewModel,
  SurveyViewModelClientDto,
} from '../../../features/survey/queries/survey.view-model';
import {
  CommandSuccessAcknowledgement,
  ICommandFsa,
} from '../../../libs/cqrs-es';
import { TestCommandStream } from '../../../libs/cqrs-es/test-utils';
import { HttpStatus } from '../../../libs/framework';

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const commandEndpoint = `${surveyIndexEndpoint}/execute`;

const testSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const targetOptionLabel = 'A';

const missingSurveyId = '404';

const missingQuestionLabel = 'XIV';

const missingOptionLabel = 'a';

type CommandErrorResponseBody = {
  status: number;
  message: string;
};

class RestCommandStreamExecutor {
  constructor(private readonly endpoint: string) {}

  async execute(fsa: ICommandFsa) {
    const response = await axios
      .post(this.endpoint, fsa)
      .catch(
        (e: {
          status: HttpStatus;
          response: { data: CommandErrorResponseBody };
        }) => {
          return {
            status: e.status,
            data: {
              message: e.response.data.message,
            },
          };
        },
      );

    const result = response.data as
      | CommandSuccessAcknowledgement
      | CommandErrorResponseBody;

    return result;
  }
}

const surveyName = 'Staff Evaluation';

const createSurvey = TestCommandStream.first(CreateSurvey, {
  name: surveyName,
});

const questionLabels = '1234'.split('');

const questionPrompts = questionLabels.map(
  (l) => `This is the prompt for test question [${l}].`,
);

const addFirstQuestionToSurvey = createSurvey.andThen(AddQuestionToSurvey, {
  label: questionLabels[0],
  prompt: questionPrompts[0],
});

const firstOptionLabel = 'i.';

const addOptionToSurveyQuestion = addFirstQuestionToSurvey.andThen(
  AddOptionToSurveyQuestion,
  {
    optionLabel: firstOptionLabel,
    questionLabel: questionLabels[0],
  },
);

const followUpQuestion = {
  label: 'A',
  prompt: 'Why would you say such a thing?',
};

const addFollowUpQuestionForOption = addOptionToSurveyQuestion.andThen(
  AddFollowUpQuestionForSurveyOption,
  {
    questionLabel: questionLabels[0],
    optionLabel: firstOptionLabel,
    followUpQuestionLabel: followUpQuestion.label,
    followUpQuestionPrompt: followUpQuestion.prompt,
  },
);

const buildSurveyDetailEndpoint = (id: string) =>
  `${surveyIndexEndpoint}/${id}`;

type SuccessResponse = {
  status: HttpStatus;
  body: CommandSuccessAcknowledgement;
};

type SuccessTestCase = {
  endpoint: string;
  commandFsa: ICommandFsa;
  // arrange: () => Promise<void>;
  assert?: (response: SuccessResponse) => Promise<void>;
};

const assertCommandSuccess = async ({
  endpoint,
  commandFsa,
  assert: assertSuccess,
}: SuccessTestCase) => {
  const response = await axios
    .post(endpoint, commandFsa)
    .catch(
      (e: {
        status: HttpStatus;
        response: { data: CommandErrorResponseBody };
      }) => {
        return {
          status: e.status,
          body: {
            message: e.response.data.message,
          },
        };
      },
    );

  expect(response.status).toBe(HttpStatus.CREATED);

  const successResponse = {
    status: response.status,

    body: (response as AxiosResponse).data as CommandSuccessAcknowledgement,
  } as unknown as SuccessResponse;

  if (typeof assertSuccess === 'function') {
    await assertSuccess(successResponse);
  }
};

const assertCommandError = async ({
  endpoint,
  commandFsa,
  assertErrorMessageAsExpected,
}: {
  endpoint: string;
  commandFsa: ICommandFsa;
  assertErrorMessageAsExpected?: (message: string) => void;
}) => {
  const result = await new RestCommandStreamExecutor(endpoint).execute(
    commandFsa,
  );

  const { message } = result as CommandErrorResponseBody;

  expect(message).toBeTruthy();

  if (typeof assertErrorMessageAsExpected === 'function') {
    assertErrorMessageAsExpected(message);
  }
};

const assertScenarioSuccess = async ({
  endpoint,
  stream,
  // name,
  assertSuccess: assertSuccessResponse,
}: {
  endpoint: string;
  stream: TestCommandStream;
  // name: string;
  assertSuccess?: (
    acks: CommandSuccessAcknowledgement[],
  ) => void | Promise<void>;
}) => {
  const results: CommandSuccessAcknowledgement[] = [];

  const fsasAndResults = await stream.execute(
    new RestCommandStreamExecutor(endpoint),
  );

  fsasAndResults.forEach(([_fsa, result]) => {
    expect((result as CommandSuccessAcknowledgement).id).toBeTruthy();

    results.push(result as CommandSuccessAcknowledgement);
  });

  if (typeof assertSuccessResponse == 'function') {
    await assertSuccessResponse(results);
  }
};

type ErrorTestCase = {
  endpoint: string;
  stream: TestCommandStream;
  assertErrorMessageAsExpected?: (message: string) => void;
};

const assertCommandStreamError = async ({
  endpoint,
  stream,
  assertErrorMessageAsExpected,
}: ErrorTestCase): Promise<void> => {
  const results = await stream.execute(new RestCommandStreamExecutor(endpoint));

  const failingCommands: [ICommandFsa, CommandErrorResponseBody][] =
    results.filter(
      (
        next: [
          ICommandFsa,
          CommandSuccessAcknowledgement | CommandErrorResponseBody,
        ],
      ): next is [ICommandFsa, CommandErrorResponseBody] => {
        const [_fsa, result] = next;

        return typeof (result as CommandErrorResponseBody).message === 'string';
      },
    );

  expect(failingCommands).toHaveLength(1);

  const resultForLastCommand = failingCommands.at(-1)?.[1];

  expect(
    (resultForLastCommand as CommandErrorResponseBody).message,
  ).toBeTruthy();

  if (
    typeof resultForLastCommand?.toString === 'function' &&
    typeof assertErrorMessageAsExpected === 'function'
  ) {
    assertErrorMessageAsExpected(resultForLastCommand.message);
  }
};

const assertQueryResponse = async <TBody = Record<string, unknown>>({
  endpoint,
  assertResponseBody,
}: {
  endpoint: string;
  assertResponseBody?: (body: TBody) => void | Promise<void>;
}): Promise<void> => {
  const result = await axios
    .get(endpoint)
    .catch(
      (e: {
        status: HttpStatus;
        response: { data: CommandErrorResponseBody };
      }) => {
        return {
          status: e.status,
          message: e.response.data.message,
        };
      },
    );

  expect(result.status).toBe(HttpStatus.OK);

  const body = (result as AxiosResponse).data as TBody;

  if (typeof assertResponseBody === 'function') {
    await assertResponseBody(body);
  }
};

const addAllQuestionsToSurvey = questionLabels.reduce(
  (acc, label) =>
    acc.andThen(AddQuestionToSurvey, {
      label,
      prompt: `This is the prompt for question [${label}]`,
    }),
  createSurvey,
);

const optionLabels = 'abcd'.split('');

const addOptionsToEveryQuestion = questionLabels.reduce(
  (outerAcc, questionLabel) => {
    return optionLabels.reduce((innerAcc, optionLabel) => {
      const followUpQuestionLabel = `${questionLabel}.${optionLabel}.FU-1`;

      return (
        innerAcc
          .andThen(AddOptionToSurveyQuestion, {
            questionLabel,
            optionLabel,
            text: `text for option ${optionLabel}`,
          })
          // we add 1 follow up (FU) question per option
          .andThen(AddFollowUpQuestionForSurveyOption, {
            questionLabel,
            optionLabel,
            followUpQuestionLabel,
            followUpQuestionPrompt: `Follow up question # ${followUpQuestionLabel}`,
          })
          // and 2 options for each follow-up question
          .andThen(AddOptionToSurveyQuestion, {
            questionLabel: followUpQuestionLabel,
            optionLabel: `FUOa`,
            text: `text for option FUOa`,
          })
          .andThen(AddOptionToSurveyQuestion, {
            questionLabel: followUpQuestionLabel,
            optionLabel: `FUOb`,
            text: `text for option FUOb`,
          })
      );
    }, outerAcc);
  },
  addAllQuestionsToSurvey,
);

const publishSurvey = addOptionsToEveryQuestion.andThen(PublishSurvey, {});

describe(`Survey Management Scenarios`, () => {
  beforeEach(async () => {
    // TODO Deal with seeding an admin user who has survey management permissions
    await axios.patch(testSetupEndpoint);
  });

  describe(`create, complete, and publish a survey`, () => {
    describe(`when creating a survey`, () => {
      describe(`when the request is valid`, () => {
        it(`should return the expected acknowledgement`, async () => {
          await assertCommandSuccess({
            endpoint: commandEndpoint,
            commandFsa: createSurvey.getCreationCommand(),
            assert: async (response) => {
              const {
                body: { id },
                status,
              } = response;

              expect(status).toBe(HttpStatus.CREATED);

              await assertQueryResponse({
                endpoint: buildSurveyDetailEndpoint(id),
              });
            },
          });
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when there is already a survey with the given name`, () => {
          it(`should return the expected error message`, async () => {
            await assertScenarioSuccess({
              endpoint: commandEndpoint,
              stream: createSurvey,
            });

            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: createSurvey,
              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain(surveyName);

                expect(message).toContain('already');

                expect(message).toContain('unique');
              },
            });
          });
        });
      });
    });

    describe(`when adding a first question to a survey`, () => {
      describe(`when the request is valid`, () => {
        it(`should succeed`, async () => {
          await assertScenarioSuccess({
            endpoint: commandEndpoint,
            stream: addFirstQuestionToSurvey,
            assertSuccess: async (acks) => {
              await assertQueryResponse({
                endpoint: buildSurveyDetailEndpoint(acks[0].id),
                assertResponseBody: (body: SurveyViewModel) => {
                  expect(body.name).toBe(surveyName);

                  expect(body.size).toBe(1);
                },
              });
            },
          });
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when the survey is already published`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: publishSurvey.andThen(AddQuestionToSurvey, {}),
              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain(surveyName);
                expect(message).toContain('has been published');
              },
            });
          });
        });

        describe(`when the target survey does not exist`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandError({
              endpoint: commandEndpoint,
              commandFsa: TestCommandStream.buildOne(AddQuestionToSurvey, {
                aggregateCompositeIdentifier: {
                  id: missingSurveyId,
                },
              }),

              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain('add');
                expect(message).toContain('question');
                expect(message).toContain('no survey');
                expect(message).toContain(missingSurveyId);
              },
            });
          });
        });

        describe(`when there is already a question with the given label`, () => {
          const duplicateQuestionLabel = 'Q1';

          it(`should return the expected error`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: createSurvey
                .andThen(AddQuestionToSurvey, {
                  label: duplicateQuestionLabel,
                })
                .andThen(AddQuestionToSurvey, {
                  label: duplicateQuestionLabel,
                }),
              assertErrorMessageAsExpected: (message) => {
                expect(message).toContain('already');
                expect(message).toContain(duplicateQuestionLabel);
              },
            });
          });
        });
      });
    });

    describe(`when removing a top-level question from a survey`, () => {
      describe(`when the request is valid`, () => {
        describe(`when the survey has one question`, () => {
          it.todo(`should leave the survey empty`);
        });

        describe(`when the survey has multiple questions`, () => {
          it.todo(`should remove the target question`);
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when the survey is already published`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the survey does not exist`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the question does not exist`, () => {
          it.todo(`should return the expected error response`);
        });
      });
    });

    describe(`when adding an option to a top-level survey question`, () => {
      describe(`when adding a first option`, () => {
        describe(`when the request is valid`, () => {
          it(`should add the option to the survey`, async () => {
            await assertScenarioSuccess({
              endpoint: commandEndpoint,
              stream: addOptionToSurveyQuestion,
              assertSuccess: async (acks) => {
                const { id } = acks[0];

                await assertQueryResponse({
                  endpoint: buildSurveyDetailEndpoint(id),
                  assertResponseBody: ({ questions }: SurveyViewModel) => {
                    const questionSearchResult = questions.find(
                      ({ label }) => label === questionLabels[0],
                    );

                    expect(questionSearchResult).toBeTruthy();
                  },
                });
              },
            });
          });
        });

        describe(`when the request is invalid`, () => {
          describe(`when the survey is already published`, () => {
            it(`should return the expected error response`, async () => {
              await assertCommandStreamError({
                endpoint: commandEndpoint,
                stream: publishSurvey.andThen(AddOptionToSurveyQuestion, {}),
                assertErrorMessageAsExpected: (message: string) => {
                  expect(message).toContain(surveyName);
                  expect(message).toContain('has been published');
                },
              });
            });
          });

          describe(`when the survey does not exist`, () => {
            it(`should return the expected error`, async () => {
              await assertCommandError({
                endpoint: commandEndpoint,
                commandFsa: TestCommandStream.buildOne(
                  AddOptionToSurveyQuestion,
                  {
                    aggregateCompositeIdentifier: {
                      id: missingSurveyId,
                    },
                    questionLabel: questionLabels[0],
                    optionLabel: firstOptionLabel,
                  },
                ),

                assertErrorMessageAsExpected: (message: string) => {
                  expect(message).toContain('no survey');

                  expect(message).toContain(missingSurveyId);

                  expect(message).toContain('add option');

                  expect(message).toContain(questionLabels[0]);

                  expect(message).toContain(firstOptionLabel);
                },
              });
            });
          });

          describe(`when the question does not exist`, () => {
            it(`should return the expected error`, async () => {
              await assertCommandStreamError({
                endpoint: commandEndpoint,
                stream: createSurvey.andThen(AddOptionToSurveyQuestion, {
                  questionLabel: missingQuestionLabel,
                }),
                // TODO rename this `assertErrorMessageAsExpected`
                assertErrorMessageAsExpected: (message: string) => {
                  expect(message).toContain(surveyName);

                  expect(message).toContain(missingQuestionLabel);

                  expect(message).toContain('no question');
                },
              });
            });
          });
        });
      });

      describe(`when adding an additional option`, () => {
        // Note that the happy path is covered in the publish test case

        describe(`when the request is invalid`, () => {
          describe(`when there is already a question with the given option`, () => {
            it(`should return the expected error`, async () => {
              await assertCommandStreamError({
                endpoint: commandEndpoint,
                stream: addOptionToSurveyQuestion.andThen(
                  AddOptionToSurveyQuestion,
                  {
                    questionLabel: questionLabels[0],
                    // This is already in use
                    optionLabel: firstOptionLabel,
                  },
                ),
                assertErrorMessageAsExpected: (message: string) => {
                  expect(message).toContain(surveyName);
                  expect(message).toContain('question');
                  expect(message).toContain(questionLabels[0]);
                  expect(message).toContain('already an option');
                  expect(message).toContain(firstOptionLabel);
                },
              });
            });
          });
        });
      });
    });

    describe(`when removing an option from a survey`, () => {
      describe(`when the survey is already published`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when the request is valid`, () => {
        describe(`when the survey has only one option`, () => {
          it.todo(`should leave the given question empty`);
        });

        describe(`when the survey has multiple options`, () => {
          it.todo(`should remove the target option`);
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when the survey is already published`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the survey does not exist`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the question does not exist`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the option does not exist`, () => {
          it.todo(`should return the expected error response`);
        });
      });
    });

    describe(`when adding a follow-up question`, () => {
      describe(`when the request is valid`, () => {
        it(`should add the follow-up question`, async () => {
          await assertScenarioSuccess({
            endpoint: commandEndpoint,
            stream: addFollowUpQuestionForOption,
            assertSuccess: async (acks) => {
              const { id } = acks[0];

              await assertQueryResponse({
                endpoint: buildSurveyDetailEndpoint(id),
                assertResponseBody: async ({
                  size,
                  questions,
                }: SurveyViewModelClientDto) => {
                  expect(size).toBe(2);

                  const searchResult = questions.find(
                    ({ label }) => label === questionLabels[0],
                  );

                  expect(searchResult).toBeTruthy();

                  const optionSearchResult =
                    searchResult?.options[firstOptionLabel];

                  expect(optionSearchResult).toBeTruthy();

                  expect(optionSearchResult?.followUpQuestions).toHaveLength(1);

                  return Promise.resolve();
                },
              });
            },
          });
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when the survey is already published`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: publishSurvey.andThen(
                AddFollowUpQuestionForSurveyOption,
                {},
              ),
              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain(surveyName);
                expect(message).toContain('has been published');
              },
            });
          });
        });

        describe(`when the survey does not exist`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandError({
              endpoint: commandEndpoint,
              commandFsa: TestCommandStream.buildOne(
                AddFollowUpQuestionForSurveyOption,
                {
                  aggregateCompositeIdentifier: {
                    id: missingSurveyId,
                  },
                  questionLabel: questionLabels[0],
                  optionLabel: targetOptionLabel,
                },
              ),
              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain(missingSurveyId);
                expect(message).toContain(questionLabels[0]);
                expect(message).toContain(targetOptionLabel);
              },
            });
          });
        });

        describe(`when the question does not exist`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: createSurvey.andThen(AddFollowUpQuestionForSurveyOption, {
                questionLabel: missingQuestionLabel,
                optionLabel: targetOptionLabel,
              }),
              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain(surveyName);
                expect(message).toContain('no such question');
                expect(message).toContain(missingQuestionLabel);
                expect(message).toContain(targetOptionLabel);
              },
            });
          });
        });

        describe(`when the option does not exist`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: addFirstQuestionToSurvey.andThen(
                AddFollowUpQuestionForSurveyOption,
                {
                  questionLabel: questionLabels[0],
                  optionLabel: missingOptionLabel,
                },
              ),
              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain(surveyName);
                expect(message).toContain(questionLabels[0]);
                expect(message).toContain(missingOptionLabel);
                expect(message).toContain('no such option');
              },
            });
          });
        });

        describe(`when there is already a question with the given label`, () => {
          it(`should return the expected error response`, async () => {
            const existingQuestionLabel = questionLabels[0];

            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: createSurvey
                .andThen(AddQuestionToSurvey, {
                  label: existingQuestionLabel,
                })
                .andThen(AddOptionToSurveyQuestion, {
                  questionLabel: existingQuestionLabel,
                  optionLabel: targetOptionLabel,
                })
                .andThen(AddFollowUpQuestionForSurveyOption, {
                  // parent question label?
                  questionLabel: existingQuestionLabel,
                  followUpQuestionLabel: existingQuestionLabel,
                  optionLabel: targetOptionLabel,
                }),
              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain('question');
                expect(message).toContain('with the label');
                expect(message).toContain(existingQuestionLabel);
                expect(message).toContain(targetOptionLabel);
                expect(message).toContain(surveyName);
              },
            });
          });
        });
      });
    });

    describe(`when removing a follow-up question from a survey`, () => {
      describe(`when the request is valid`, () => {
        it.todo(
          `should remove the follow-up question from the relevant option`,
        );
      });

      describe(`when the request is invalid`, () => {
        describe(`when the survey does not exist`, () => {
          it.todo(`should return the expected error response`);
        });

        describe(`when the question does not exist`, () => {
          it.todo(`should return the expected error response`);
        });
      });
    });

    describe(`when publishing a survey`, () => {
      describe(`when the request is valid`, () => {
        it(`should publish the survey`, async () => {
          await assertScenarioSuccess({
            endpoint: commandEndpoint,
            stream: publishSurvey,
            assertSuccess: async (acks) => {
              await assertQueryResponse({
                endpoint: buildSurveyDetailEndpoint(acks[0].id),
                assertResponseBody: async (body: SurveyViewModel) => {
                  expect(body.isPublished).toBe(true);

                  return Promise.resolve();
                },
              });
            },
          });
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when the survey is already published`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: publishSurvey.andThen(PublishSurvey, {}),
              assertErrorMessageAsExpected: (message: string) => {
                expect(message).toContain(surveyName);
                expect(message).toContain('has been published');
              },
            });
          });
        });

        describe(`when the survey has no questions`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: createSurvey.andThen(PublishSurvey),
              assertErrorMessageAsExpected: (message) => {
                expect(message).toContain(surveyName);
                expect(message).toContain('publish');
                expect(message).toContain('must have at least one question');
              },
            });
          });
        });

        describe(`when one of the questions has no options`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: addFirstQuestionToSurvey.andThen(PublishSurvey, {}),
              assertErrorMessageAsExpected: (message) => {
                expect(message).toContain(surveyName);
                expect(message).toContain(questionLabels[0]);
                expect(message).toContain('at least 2 options');
              },
            });
          });
        });

        describe(`when one of the question has an option with an empty follow-up question`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: addFollowUpQuestionForOption.andThen(PublishSurvey),
              assertErrorMessageAsExpected: (message) => {
                expect(message).toContain(surveyName);
                expect(message).toContain(followUpQuestion.label);
                expect(message).toContain('at least 2 options');
              },
            });
          });
        });
      });
    });
  });
});
