import axios from 'axios';
import { CreateFlag } from '../../../features/flags/commands';
import { FlagViewModel } from '../../../features/flags/queries';
import {
  SurveyViewModel,
  SurveyViewModelClientDto,
} from '../../../features/survey/queries/survey.view-model';
import { AddFollowUpQuestionForSurveyOption } from '../../../features/survey/survey-management/commands/add-follow-up-question-for-survey-option.command';
import { AddOptionToSurveyQuestion } from '../../../features/survey/survey-management/commands/add-option-to-survey-question.command';
import { AddQuestionToSurvey } from '../../../features/survey/survey-management/commands/add-question-to-survey.command';
import { CreateSurvey } from '../../../features/survey/survey-management/commands/create-survey.command';
import { FlagSurveyOption } from '../../../features/survey/survey-management/commands/flag-survey-option.command';
import { PublishSurvey } from '../../../features/survey/survey-management/commands/publish-survey.command';
import { TestCommandStream } from '../../../libs/cqrs-es/test-utils';
import { HttpStatus } from '../../../libs/framework';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
  assertCommandSuccess,
  assertQueryResponse,
} from '../utils';

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const commandEndpoint = `${surveyIndexEndpoint}/commands`;

const flagIndexEndpoint = `${baseEndpoint}/flags`;

const flagCommandsEndpoint = `${flagIndexEndpoint}/commands`;

const testSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const targetOptionLabel = 'A';

const missingSurveyId = '404';

const missingQuestionLabel = 'XIV';

const missingOptionLabel = 'HotDog';

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

const flagLabel = 'socially awkward';

const flagDescription = `should not be pressured to interact with others, especially in a large group`;

const missingFlagId = 'f404';

const labelOfTopLevelQuestionToFlag = '1';
const labelOfTopLevelOptionToFlag = 'a';
const labelOfFollowUpQuestionToFlag = '1.a.FU-1';
const labelOfFollowUpOptionToFlag = 'FUOa';

describe(`Survey Management Scenarios`, () => {
  let flagId: string;

  beforeEach(async () => {
    // TODO Deal with seeding an admin user who has survey management permissions
    await axios.patch(testSetupEndpoint);

    await axios.patch(`${baseEndpoint}/flags/test-setup`);

    await assertCommandSuccess({
      endpoint: flagCommandsEndpoint,
      commandFsa: TestCommandStream.buildOne(CreateFlag, {
        label: flagLabel,
        description: flagDescription,
      }),
    });

    const allFlags = (await axios.get(flagIndexEndpoint))
      .data as FlagViewModel[];

    // TODO use a query endpoint for this
    flagId = allFlags.find((f) => f.label === flagLabel)?.id as string;
  });

  describe(`create, complete, and publish a survey`, () => {
    describe(`when creating a survey`, () => {
      describe(`when the request is valid`, () => {
        it(`should return the expected acknowledgement`, async () => {
          await assertCommandSuccess({
            endpoint: commandEndpoint,
            commandFsa: createSurvey.getCreationCommand(),
            assertSuccess: async (response) => {
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
            await assertCommandScenarioSuccess({
              endpoint: commandEndpoint,
              stream: createSurvey,
            });

            await assertCommandScenarioError({
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
          await assertCommandScenarioSuccess({
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
            await assertCommandScenarioError({
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
            await assertCommandScenarioError({
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
            await assertCommandScenarioSuccess({
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
              await assertCommandScenarioError({
                endpoint: commandEndpoint,
                stream: publishSurvey.andThen(AddOptionToSurveyQuestion, {
                  questionLabel: questionLabels[0],
                  optionLabel: 'new-option-label-X',
                }),
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
              await assertCommandScenarioError({
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
              await assertCommandScenarioError({
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
          await assertCommandScenarioSuccess({
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

                  expect(
                    Object.keys(optionSearchResult?.followUpQuestions || {}),
                  ).toHaveLength(1);

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
            await assertCommandScenarioError({
              endpoint: commandEndpoint,
              stream: publishSurvey.andThen(
                AddFollowUpQuestionForSurveyOption,
                {
                  questionLabel: `${questionLabels[0]}.${optionLabels[0]}.FU-1`,
                  optionLabel: `FUOa`,
                  followUpQuestionLabel: `FU2-label`,
                  followUpQuestionPrompt: 'You forgot to ask this one!',
                },
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
            await assertCommandScenarioError({
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
            await assertCommandScenarioError({
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

            await assertCommandScenarioError({
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
          await assertCommandScenarioSuccess({
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
            await assertCommandScenarioError({
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
            await assertCommandScenarioError({
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
            await assertCommandScenarioError({
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
            await assertCommandScenarioError({
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

    describe(`when adding a flag to a survey option`, () => {
      describe(`when the survey exists`, () => {
        describe(`when the question exists`, () => {
          describe(`when it is a top-level question`, () => {
            describe(`when the option exists`, () => {
              describe(`when the option does not yet have the given flag`, () => {
                describe(`when the flag exists`, () => {
                  it(`should add the flag`, async () => {
                    await assertCommandScenarioSuccess({
                      endpoint: commandEndpoint,
                      stream: publishSurvey.andThen(FlagSurveyOption, {
                        flagId,
                        questionLabel: labelOfTopLevelQuestionToFlag,
                        optionLabel: labelOfTopLevelOptionToFlag,
                      }),
                      assertSuccess: async (acks) => {
                        const result = (
                          await axios.get(
                            `${surveyIndexEndpoint}/${acks[0].id}`,
                          )
                        ).data as SurveyViewModelClientDto;

                        const { questions } = result;

                        const targetQuestion =
                          questions[labelOfTopLevelQuestionToFlag];

                        const targetOption =
                          targetQuestion.options[labelOfTopLevelOptionToFlag];

                        const targetFlag = targetOption.flags[flagId];

                        expect(targetFlag).toEqual({
                          id: flagId,
                          label: flagLabel,
                          description: flagDescription,
                        });
                      },
                    });
                  });
                });

                describe(`when the flag does not exist`, () => {
                  it(`should return the expected error resposne`, async () => {
                    const questionLabel = labelOfTopLevelQuestionToFlag;
                    const optionLabel = labelOfTopLevelOptionToFlag;

                    await assertCommandScenarioError({
                      endpoint: commandEndpoint,
                      stream: publishSurvey.andThen(FlagSurveyOption, {
                        flagId: missingFlagId,
                        questionLabel,
                        optionLabel,
                      }),
                      assertErrorMessageAsExpected: (message) => {
                        assertTextMatchesAll(
                          message,
                          surveyName,
                          missingFlagId,
                          'no such flag',
                        );
                      },
                    });
                  });
                });
              });

              describe(`when the option already has the given flag`, () => {
                const questionLabel = '1';
                const optionLabel = 'a';

                it(`should return the expected error response`, async () => {
                  await assertCommandScenarioError({
                    endpoint: commandEndpoint,
                    stream: publishSurvey
                      .andThen(FlagSurveyOption, {
                        flagId,
                        questionLabel,
                        optionLabel,
                      })
                      .andThen(FlagSurveyOption, {
                        flagId,
                        questionLabel,
                        optionLabel,
                      }),
                    assertErrorMessageAsExpected: (message) => {
                      assertTextMatchesAll(
                        message,
                        surveyName,
                        questionLabel,
                        optionLabel,
                        flagId,
                        'already',
                      );
                    },
                  });
                });
              });
            });

            describe(`when the option does not exist`, () => {
              it(`should return the expected error response`, async () => {
                await assertCommandScenarioError({
                  endpoint: commandEndpoint,
                  stream: publishSurvey.andThen(FlagSurveyOption, {
                    flagId,
                    questionLabel: labelOfTopLevelQuestionToFlag,
                    optionLabel: missingOptionLabel,
                  }),
                  assertErrorMessageAsExpected: (message) => {
                    assertTextMatchesAll(
                      message,
                      surveyName,
                      labelOfTopLevelQuestionToFlag,
                      missingOptionLabel,
                      flagId,
                      'no such option',
                    );
                  },
                });
              });
            });
          });

          describe(`when it is a follow-up question`, () => {
            describe(`when the option exists`, () => {
              describe(`when the option does not yet have the given flag`, () => {
                describe(`when the flag exists`, () => {
                  it(`should add the flag`, async () => {
                    await assertCommandScenarioSuccess({
                      endpoint: commandEndpoint,
                      stream: publishSurvey.andThen(FlagSurveyOption, {
                        flagId,
                        questionLabel: labelOfFollowUpQuestionToFlag,
                        optionLabel: labelOfFollowUpOptionToFlag,
                      }),
                      assertSuccess: async (acks) => {
                        const { questions } = (
                          await axios.get(
                            `${surveyIndexEndpoint}/${acks[0].id}`,
                          )
                        ).data as SurveyViewModelClientDto;

                        expect(questions).toBeTruthy();

                        const parentQuestion = questions[0];

                        const parentOption = parentQuestion.options['a'];

                        const flaggedFollowUpQuestion =
                          parentOption.followUpQuestions[
                            labelOfFollowUpQuestionToFlag
                          ];

                        const flaggedFollowUpOption =
                          flaggedFollowUpQuestion.options[
                            labelOfFollowUpOptionToFlag
                          ];

                        expect(
                          Object.keys(flaggedFollowUpOption.flags),
                        ).toHaveLength(1);

                        const flagSearchResult =
                          flaggedFollowUpOption.flags[flagId];

                        expect(flagSearchResult).toEqual({
                          id: flagId,
                          label: flagLabel,
                          description: flagDescription,
                        });
                      },
                    });
                  });
                });

                describe(`when the flag does not exist`, () => {
                  it(`should return the expected error resposne`, async () => {
                    await assertCommandScenarioError({
                      endpoint: commandEndpoint,
                      stream: publishSurvey.andThen(FlagSurveyOption, {
                        flagId: missingFlagId,
                        questionLabel: labelOfFollowUpQuestionToFlag,
                        optionLabel: labelOfFollowUpOptionToFlag,
                      }),
                      assertErrorMessageAsExpected: (message) => {
                        assertTextMatchesAll(
                          message,
                          surveyName,
                          missingFlagId,
                          'no such flag',
                        );
                      },
                    });
                  });
                });
              });

              describe(`when the option already has the given flag`, () => {
                it(`should return the expected error response`, async () => {
                  await assertCommandScenarioError({
                    endpoint: commandEndpoint,
                    stream: publishSurvey
                      .andThen(FlagSurveyOption, {
                        flagId,
                        questionLabel: labelOfFollowUpQuestionToFlag,
                        optionLabel: labelOfFollowUpOptionToFlag,
                      })
                      .andThen(FlagSurveyOption, {
                        flagId,
                        questionLabel: labelOfFollowUpQuestionToFlag,
                        optionLabel: labelOfFollowUpOptionToFlag,
                      }),
                    assertErrorMessageAsExpected: (message) => {
                      assertTextMatchesAll(
                        message,
                        flagId,
                        labelOfFollowUpQuestionToFlag,
                        labelOfFollowUpOptionToFlag,
                        'already has',
                      );
                    },
                  });
                });
              });
            });

            describe(`when the option does not exist`, () => {
              it(`should return the expected error response`, async () => {
                await assertCommandScenarioError({
                  endpoint: commandEndpoint,
                  stream: publishSurvey.andThen(FlagSurveyOption, {
                    flagId,
                    questionLabel: labelOfFollowUpQuestionToFlag,
                    optionLabel: missingOptionLabel,
                  }),
                  assertErrorMessageAsExpected: (message) => {
                    assertTextMatchesAll(
                      message,
                      surveyName,
                      flagId,
                      labelOfFollowUpQuestionToFlag,
                      missingOptionLabel,
                      'cannot',
                      'flag',
                    );
                  },
                });
              });
            });
          });
        });

        describe(`when the question does not exist`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandScenarioError({
              endpoint: commandEndpoint,
              stream: publishSurvey.andThen(FlagSurveyOption, {
                flagId,
                questionLabel: missingQuestionLabel,
              }),
              assertErrorMessageAsExpected: (message) => {
                // TODO Should we change it to `flagOption` and `FLAG_SURVEY_OPTION` insead of addFlag?
                assertTextMatchesAll(
                  message,
                  'cannot add flag',
                  missingQuestionLabel,
                  surveyName,
                );
              },
            });
          });
        });
      });

      describe(`when the survey does not exist`, () => {
        it(`should return the expected error response`, async () => {
          await assertCommandError({
            endpoint: commandEndpoint,
            commandFsa: TestCommandStream.buildOne(FlagSurveyOption, {
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
});
