import axios from 'axios';
import { CLIENT_AGGREGATE_TYPE } from '../../../features/clients/client.composite-identifier';
import { CreateClient } from '../../../features/clients/commands/create-client.command';
import { CreateCommunity } from '../../../features/communities/commands';
import { CommunityViewModelClientDto } from '../../../features/communities/queries';
import { CreateFlag } from '../../../features/flags/commands';
import { FlagViewModelClientDto } from '../../../features/flags/queries';
import { SurveyViewModelClientDto } from '../../../features/survey/queries/survey.view-model';
import {
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
import { SurveyOptionPersistenceDto } from '../../../features/survey/survey-management/survey-option.entity';
import { SurveyQuestionPersistenceDto } from '../../../features/survey/survey-management/survey-question.entity';
import {
  AcknowledgeResponseForSurveyQuestionHasBeenViewed,
  AddGeneralNoteAboutSurveyResponse,
  AddNoteAboutQuestionResponse,
  BeginReviewOfSurvey,
  FlagSurveyQuestionResponse,
} from '../../../features/survey/survey-review';
import {
  SurveyQuestionReviewRecordViewModelClientDto,
  SurveyReviewViewModelClientDto,
} from '../../../features/survey/survey-review/queries';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
  assertCommandSuccess,
} from '../utils';

/**
 * There is a fair deal of dependent state for this test.
 * - Community
 * - Client (belongs to community)
 * - Survey
 * - SurveyResponseRecord (copy of Survey completed by a Client)
 */

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const indexEndpoints = {
  clients: `${baseEndpoint}/clients`,
  communities: `${baseEndpoint}/communities`,
  surveys: `${baseEndpoint}/surveys`,
  responses: `${baseEndpoint}/surveys/responses`,
  reviews: `${baseEndpoint}/surveys/reviews`,
  flags: `${baseEndpoint}/flags`,
};

const buildCommandEndpoint = (indexEndpoint: string) =>
  `${indexEndpoint}/commands`;

const buildDetailQueryEndpoint = (indexEndpoint: string, id: string) =>
  `${indexEndpoint}/${id}`;

const buildTestSetupEndpoint = (indexEndpoint: string) =>
  `${indexEndpoint}/test-setup`;

const questions: (Omit<SurveyQuestionPersistenceDto, 'options'> & {
  options: Record<
    string,
    Omit<SurveyOptionPersistenceDto, 'flagIds' | 'values' | 'label'>
  >;
})[] = [
  {
    label: '1',
    prompt: 'do you like this survey?',
    options: {
      a: {
        text: 'yes',
      },
      b: {
        text: 'maybe',
      },
      c: {
        text: 'no',
        nextQuestionLabel: '2',
      },
    },
  },
  {
    label: '2',
    prompt: 'Why not?',
    options: {
      a: {
        text: 'It is lame.',
      },
      b: {
        text: 'It is too short.',
      },
      c: {
        text: 'It is too long.',
      },
      d: {
        text: `I've never met a survey I like.`,
      },
    },
  },
  {
    label: '3',
    prompt: 'will you take my other survey?',
    options: {
      a: {
        text: 'yes',
      },
      b: {
        text: 'maybe',
      },
      c: {
        text: 'no',
      },
    },
  },
];

const surveyName = 'Monthly Check-In';

const missingAggregateId = 'nf-404';

const missingQuestionLabel = 'Q3';

const targetQuestion = '1';

const flagLabel = 'Sus';

describe(`when reviewing a survey (e.g. when a clinician reviews a client's response to a particular survey)`, () => {
  let communityId: string;
  let clientId: string;
  let surveyId: string;
  let flagId: string;
  let surveyResponseRecordId: string;

  beforeAll(async () => {
    await axios.patch(buildTestSetupEndpoint(indexEndpoints.communities));
    await axios.patch(buildTestSetupEndpoint(indexEndpoints.clients));
    await axios.patch(buildTestSetupEndpoint(indexEndpoints.surveys));
    await axios.patch(buildTestSetupEndpoint(indexEndpoints.responses));
    await axios.patch(buildTestSetupEndpoint(indexEndpoints.flags));

    await assertCommandSuccess({
      endpoint: buildCommandEndpoint(indexEndpoints.flags),
      commandFsa: TestCommandStream.buildOne(CreateFlag, {
        label: flagLabel,
      }),
    });

    flagId = (
      (await axios.get(indexEndpoints.flags)).data as FlagViewModelClientDto[]
    )[0].id;

    await assertCommandSuccess({
      endpoint: buildCommandEndpoint(indexEndpoints.communities),
      commandFsa: TestCommandStream.buildOne(CreateCommunity, {}),
    });

    communityId = (
      (await axios.get(indexEndpoints.communities))
        .data as CommunityViewModelClientDto[]
    )[0].id;

    await assertCommandSuccess({
      endpoint: buildCommandEndpoint(indexEndpoints.clients),
      commandFsa: TestCommandStream.buildOne(CreateClient, {
        communityId,
      }),
    });

    clientId = (
      (await axios.get(indexEndpoints.clients))
        .data as CommunityViewModelClientDto[]
    )[0].id;

    await assertCommandScenarioSuccess({
      endpoint: buildCommandEndpoint(indexEndpoints.surveys),
      stream: questions
        .reduce(
          (acc: TestCommandStream, nextQuestion) => {
            const addQuestion =
              nextQuestion.label === '2'
                ? acc.andThen(AddFollowUpQuestionForSurveyOption, {
                    questionLabel: '1',
                    optionLabel: 'c',
                    followUpQuestionLabel: '2',
                    followUpQuestionPrompt: questions[1].prompt,
                  })
                : acc.andThen(AddQuestionToSurvey, {
                    label: nextQuestion.label,
                  });

            return Object.entries(nextQuestion.options).reduce(
              (innerAcc, [optionLabel, { text }]) => {
                return innerAcc.andThen(AddOptionToSurveyQuestion, {
                  questionLabel: nextQuestion.label,
                  optionLabel,
                  text,
                });
              },
              addQuestion,
            );
          },
          TestCommandStream.first(CreateSurvey, {
            name: surveyName,
          }),
        )
        .andThen(PublishSurvey),
    });

    surveyId = (
      (await axios.get(indexEndpoints.surveys))
        .data as SurveyViewModelClientDto[]
    )[0].id;

    const completeSurveyAsClient = TestCommandStream.first(BeginSurvey, {
      surveyId,
      participantCompositeIdentifier: {
        type: CLIENT_AGGREGATE_TYPE,
        id: clientId,
      },
    })
      .andThen(AnswerSurveyQuestion, {
        questionLabel: '1',
        chosenOptionLabel: 'c',
      })
      .andThen(AnswerSurveyQuestion, {
        questionLabel: '2',
        chosenOptionLabel: 'b',
      })
      .andThen(AnswerSurveyQuestion, {
        questionLabel: '3',
        chosenOptionLabel: 'a',
      })
      .andThen(SubmitSurvey);

    await assertCommandScenarioSuccess({
      endpoint: buildCommandEndpoint(indexEndpoints.surveys),
      stream: completeSurveyAsClient,
    });

    surveyResponseRecordId = (
      (await axios.get(indexEndpoints.responses))
        .data as SurveyReviewViewModelClientDto[]
    )[0].id;
  });

  beforeEach(async () => {
    await axios.patch(buildTestSetupEndpoint(indexEndpoints.reviews));
  });

  describe(`when beginning a review`, () => {
    describe(`when the target survey attempt exists`, () => {
      describe(`when the attempt has been submitted`, () => {
        it(`should create a new in-progress review`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId,
            }),
            assertSuccess: async (acks) => {
              const newReviewRecord = (
                await axios.get(
                  buildDetailQueryEndpoint(indexEndpoints.reviews, acks[0].id),
                )
              ).data as SurveyReviewViewModelClientDto;

              expect(newReviewRecord).toBeTruthy();

              expect(newReviewRecord.surveyName).toBe(surveyName);
              // expect(newReviewRecord.surveyParticipantLabel).toBe('TODO')

              expect(newReviewRecord.isComplete).toBe(false);

              expect(newReviewRecord.size).toBe(0);
            },
          });
        });
      });

      describe(`when the attempt has not been submitted`, () => {
        it(`should return the expected error response`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginSurvey, {
              surveyId,
              participantCompositeIdentifier: {
                type: CLIENT_AGGREGATE_TYPE,
                id: clientId,
              },
            }),
          });

          const incompleteResponseRecordQueryResult = (
            (await axios.get(indexEndpoints.responses))
              .data as SurveyResponseRecordViewModel[]
          ).find((r) => r.hasBeenSubmitted === false);

          const incompleteSurveyResponseId =
            incompleteResponseRecordQueryResult?.id as string;

          await assertCommandScenarioError({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId: incompleteSurveyResponseId,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                surveyName,
                'has not been submitted',
              );
            },
          });
        });
      });
    });

    describe(`when the target survey attempt does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandError({
          endpoint: buildCommandEndpoint(indexEndpoints.surveys),
          commandFsa: TestCommandStream.buildOne(BeginReviewOfSurvey, {
            surveyResponseRecordId: missingAggregateId,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              missingAggregateId,
              'no such attempt',
            );
          },
        });
      });
    });
  });

  describe(`when acknowledging the participant's response to a survey question`, () => {
    describe(`when the target in-progress review exists`, () => {
      describe(`when the question has not yet been marked as viewed`, () => {
        it(`should mark the question as viewed`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId,
            }).andThen(AcknowledgeResponseForSurveyQuestionHasBeenViewed, {
              questionLabel: '1',
            }),
            assertSuccess: async (acks) => {
              const updatedReviewRecord = (
                await axios.get(
                  buildDetailQueryEndpoint(indexEndpoints.reviews, acks[0].id),
                )
              ).data as SurveyQuestionReviewRecordViewModelClientDto;

              expect(updatedReviewRecord);
            },
          });
        });
      });

      describe(`when the question has already been marked as viewed`, () => {
        const repeatedQuestionLabel = '1';

        it(`should return the expected error response`, async () => {
          await assertCommandScenarioError({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId,
            })
              .andThen(AcknowledgeResponseForSurveyQuestionHasBeenViewed, {
                questionLabel: repeatedQuestionLabel,
              })
              .andThen(AcknowledgeResponseForSurveyQuestionHasBeenViewed, {
                questionLabel: repeatedQuestionLabel,
              }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                surveyName,
                repeatedQuestionLabel,
                'cannot acknowledge review of question',
                'already',
              );
            },
          });
        });
      });
    });

    describe(`when the target in-progress review does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandError({
          endpoint: buildCommandEndpoint(indexEndpoints.surveys),
          commandFsa: TestCommandStream.buildOne(
            AcknowledgeResponseForSurveyQuestionHasBeenViewed,
            {
              aggregateCompositeIdentifier: {
                id: missingAggregateId,
              },
            },
          ),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              missingAggregateId,
              'no such attempt',
            );
          },
        });
      });
    });
  });

  describe(`when adding a note about a participant's response to a particular question`, () => {
    describe(`when the question exists`, () => {
      describe(`when the question has no notes`, () => {
        it(`should add a first note`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId,
            }).andThen(AddNoteAboutQuestionResponse, {
              questionLabel: targetQuestion,
            }),
            assertSuccess: async (acks) => {
              const updatedReviewRecord = (
                await axios.get(
                  buildDetailQueryEndpoint(indexEndpoints.reviews, acks[0].id),
                )
              ).data as SurveyReviewViewModelClientDto;

              expect(updatedReviewRecord.questions[0].notes).toHaveLength(1);

              // Note that making a note about a question's response automatically marks it as viewed
              expect(updatedReviewRecord.questions[0].hasBeenViewed).toBe(true);

              // Do we really want to call this size? What do we call the number of questions?
              expect(updatedReviewRecord.size).toBe(1);

              expect(updatedReviewRecord.isComplete).toBe(false);
            },
          });
        });
      });

      describe(`when the question has existing notes`, () => {
        /**
         * Note that we are intentionally reviewing the questions out of order to
         * confirm that this is not a problem.
         */
        const existingQuestionLabel = '2';

        const secondNoteText = 'Also, note that bla bla bla.';

        const secondNoteLanguageCode = 'en';

        it(`should add an additional note`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId,
            })
              .andThen(AddNoteAboutQuestionResponse, {
                questionLabel: existingQuestionLabel,
              })
              .andThen(AddNoteAboutQuestionResponse, {
                questionLabel: existingQuestionLabel,
                note: secondNoteText,
                languageCode: secondNoteLanguageCode,
              }),
            assertSuccess: async (acks) => {
              const updatedReviewRecord = (
                await axios.get(
                  buildDetailQueryEndpoint(indexEndpoints.reviews, acks[0].id),
                )
              ).data as SurveyReviewViewModelClientDto;

              const targetQuestion = updatedReviewRecord.questions.find(
                (q) => q.label === existingQuestionLabel,
              ) as SurveyQuestionReviewRecordViewModelClientDto;

              expect(targetQuestion.notes).toHaveLength(2);

              const secondNote = targetQuestion.notes[1];

              expect(
                secondNote.items[secondNoteLanguageCode].original?.text,
              ).toEqual(secondNoteText);

              // Note that making a note about a question's response automatically marks it as viewed
              expect(targetQuestion.hasBeenViewed).toBe(true);

              // Do we really want to call this size? What do we call the number of questions?
              expect(updatedReviewRecord.size).toBe(1);

              expect(updatedReviewRecord.isComplete).toBe(false);
            },
          });
        });
      });
    });

    describe(`when the question does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandScenarioError({
          endpoint: buildCommandEndpoint(indexEndpoints.surveys),
          stream: TestCommandStream.first(BeginReviewOfSurvey, {
            surveyResponseRecordId,
          }).andThen(AddNoteAboutQuestionResponse, {
            questionLabel: missingQuestionLabel,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              surveyName,
              missingQuestionLabel,
              'no such question',
            );
          },
        });
      });
    });

    describe(`when the language code is invalid`, () => {
      const invalidLanguageCode = 'xyz';

      it(`should return the expected error response`, async () => {
        await assertCommandScenarioError({
          endpoint: buildCommandEndpoint(indexEndpoints.surveys),
          stream: TestCommandStream.first(BeginReviewOfSurvey, {
            surveyResponseRecordId,
          }).andThen(AddNoteAboutQuestionResponse, {
            questionLabel: targetQuestion,
            languageCode: invalidLanguageCode,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              surveyName,
              targetQuestion,
              'provided language',
              'not supported',
              invalidLanguageCode,
            );
          },
        });
      });
    });
  });

  describe(`when translating a note about a participant's response to a particular question`, () => {
    it.todo(`should have tests`);
  });

  describe(`when adding a general note about the participant's response to this survey`, () => {
    const firstNoteText = 'Not a lot to see here.';

    const firstNoteLanguageCode = 'en';

    describe(`when the language code is valid`, () => {
      describe(`when there are no general notes`, () => {
        it(`should add a first general note`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId,
            }).andThen(AddGeneralNoteAboutSurveyResponse, {
              languageCode: firstNoteLanguageCode,
              note: firstNoteText,
            }),
            assertSuccess: async (acks) => {
              const updatedReviewRecord = (
                await axios.get(
                  buildDetailQueryEndpoint(indexEndpoints.reviews, acks[0].id),
                )
              ).data as SurveyReviewViewModelClientDto;

              expect(updatedReviewRecord.generalNotes).toHaveLength(1);

              const firstNote = updatedReviewRecord.generalNotes[0];

              expect(
                firstNote.items[firstNoteLanguageCode].original?.text,
              ).toBe(firstNoteText);
            },
          });
        });
      });

      describe(`when there are existing general notes`, () => {
        const secondNoteText =
          'But this is one thing I noticed. Bla bla bla bla bla, Charley Brown.';

        const secondNoteLanguageCode = 'clc';

        it(`should add an additional note`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId,
            })
              .andThen(AddGeneralNoteAboutSurveyResponse, {
                note: firstNoteText,
                languageCode: firstNoteLanguageCode,
              })
              .andThen(AddGeneralNoteAboutSurveyResponse, {
                note: secondNoteText,
                languageCode: secondNoteLanguageCode,
              }),
            assertSuccess: async (acks) => {
              const updatedReviewRecord =
                // TODO review or review record in the name here?
                (
                  await axios.get(
                    buildDetailQueryEndpoint(
                      indexEndpoints.reviews,
                      acks[0].id,
                    ),
                  )
                ).data as SurveyReviewViewModelClientDto;

              const { generalNotes } = updatedReviewRecord;

              expect(generalNotes).toHaveLength(2);

              const secondNote = generalNotes[1];

              expect(
                secondNote.items[secondNoteLanguageCode].original?.text,
              ).toEqual(secondNoteText);
            },
          });
        });
      });
    });
  });

  describe(`when translating a general note about this participant's responses`, () => {
    it.todo(`should have tests`);
  });

  describe(`when flagging a participant's response to a particular question`, () => {
    describe(`when the target survey review exists`, () => {
      describe(`when the question exists`, () => {
        describe(`when the flag exists`, () => {
          describe(`when the question does not yet have the given flag`, () => {
            describe(`when the question has no existing flags`, () => {
              it(`should add the first flag`, async () => {
                await assertCommandScenarioSuccess({
                  endpoint: buildCommandEndpoint(indexEndpoints.surveys),
                  stream: TestCommandStream.first(BeginReviewOfSurvey, {
                    surveyResponseRecordId,
                  }).andThen(FlagSurveyQuestionResponse, {
                    questionLabel: targetQuestion,
                    flagId,
                  }),
                });
              });
            });

            describe(`when the question has existing flags`, () => {
              let secondFlagId: string;

              const secondFlagLabel = 'tells strange jokes';

              beforeEach(async () => {
                await assertCommandSuccess({
                  endpoint: buildCommandEndpoint(indexEndpoints.flags),
                  commandFsa: TestCommandStream.buildOne(CreateFlag, {
                    label: secondFlagLabel,
                  }),
                });

                const allFlags = (await axios.get(indexEndpoints.flags))
                  .data as FlagViewModelClientDto[];

                const secondFlag = allFlags.find(
                  (f) => f.label === secondFlagLabel,
                );

                secondFlagId = secondFlag?.id as string;
              });

              it(`should add the additional flag`, async () => {
                await assertCommandScenarioSuccess({
                  endpoint: buildCommandEndpoint(indexEndpoints.surveys),
                  stream: TestCommandStream.first(BeginReviewOfSurvey, {
                    surveyResponseRecordId,
                  })
                    .andThen(FlagSurveyQuestionResponse, {
                      questionLabel: targetQuestion,
                      flagId,
                    })
                    .andThen(FlagSurveyQuestionResponse, {
                      questionLabel: targetQuestion,
                      flagId: secondFlagId,
                    }),
                  assertSuccess: async (acks) => {
                    const updatedReviewRecord = (
                      await axios.get(
                        buildDetailQueryEndpoint(
                          indexEndpoints.reviews,
                          acks[0].id,
                        ),
                      )
                    ).data as SurveyReviewViewModelClientDto;

                    const updatedQuestion = updatedReviewRecord.questions.find(
                      (q) => q.label === targetQuestion,
                    ) as SurveyQuestionReviewRecordViewModelClientDto;

                    const allFlagIds = Object.keys(updatedQuestion.flagsById);

                    expect(allFlagIds).toHaveLength(2);

                    expect(allFlagIds).toContain(flagId); // first flag ID

                    expect(allFlagIds).toContain(secondFlagId);

                    const secondFlagSearchResult =
                      updatedQuestion.flagsById[secondFlagId];

                    expect(secondFlagSearchResult.label).toBe(secondFlagLabel);

                    // TODO what about the description?
                  },
                });
              });
            });
          });

          describe(`when the question already has the given flag`, () => {
            it(`should return the expected error response`, async () => {
              await assertCommandScenarioError({
                endpoint: buildCommandEndpoint(indexEndpoints.surveys),
                stream: TestCommandStream.first(BeginReviewOfSurvey, {
                  surveyResponseRecordId,
                })
                  .andThen(FlagSurveyQuestionResponse, {
                    questionLabel: targetQuestion,
                    flagId,
                  })
                  .andThen(FlagSurveyQuestionResponse, {
                    questionLabel: targetQuestion,
                    flagId,
                  }),

                assertErrorMessageAsExpected: (message) => {
                  assertTextMatchesAll(
                    message,
                    'cannot flag',
                    targetQuestion,
                    flagId,
                    'already',
                  );
                },
              });
            });
          });
        });

        describe(`when the flag does not exist`, () => {
          const missingFlagId = 'f505';

          it(`should return the expected error response`, async () => {
            await assertCommandScenarioError({
              endpoint: buildCommandEndpoint(indexEndpoints.surveys),
              stream: TestCommandStream.first(BeginReviewOfSurvey, {
                surveyResponseRecordId,
              }).andThen(FlagSurveyQuestionResponse, {
                questionLabel: targetQuestion,
                flagId: missingFlagId,
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  missingFlagId,
                  surveyName,
                  'cannot flag',
                  'no such flag',
                );
              },
            });
          });
        });
      });

      describe(`when the question does not exist`, () => {
        it(`should return the epected error response`, async () => {
          await assertCommandScenarioError({
            endpoint: buildCommandEndpoint(indexEndpoints.surveys),
            stream: TestCommandStream.first(BeginReviewOfSurvey, {
              surveyResponseRecordId,
            }).andThen(FlagSurveyQuestionResponse, {
              flagId,
              questionLabel: missingQuestionLabel,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                flagId,
                missingQuestionLabel,
                surveyName,
                'no such question',
              );
            },
          });
        });
      });
    });

    describe(`when the target survey review does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandError({
          endpoint: buildCommandEndpoint(indexEndpoints.surveys),
          commandFsa: TestCommandStream.buildOne(FlagSurveyQuestionResponse, {
            aggregateCompositeIdentifier: {
              id: missingAggregateId,
            },
            questionLabel: targetQuestion,
            flagId,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(message, 'no such attempt');
          },
        });
      });
    });
  });

  describe(`when submitting a partial review`, () => {
    describe(`when the target survey review exists`, () => {
      describe(`when the review has not yet been submitted`, () => {
        describe(`when the survey review is complete`, () => {
          it.todo(`should return the expected error resposne`);
        });

        describe(`when the survey review is incomplete`, () => {
          it.todo(`should submit the review`);
        });
      });

      describe(`when the review has already been submitted`, () => {
        it.todo(`should return the expected error response`);
      });
    });

    describe(`when the target survey review does not exist`, () => {
      it.todo(`should return the expected error response`);
    });
  });

  describe(`when submitting a complete review`, () => {
    describe(`when the target survey review exists`, () => {
      describe(`when the review has not yet been submitted`, () => {
        describe(`when the survey review is complete`, () => {
          it.todo(`should submit the review`);
        });

        describe(`when the survey review is incomplete`, () => {
          it.todo(`should return the expected error resposne`);
        });
      });

      describe(`when the review has already been submitted`, () => {
        it.todo(`should return the expected error response`);
      });
    });

    describe(`when the target survey review does not exist`, () => {
      it.todo(`should return the expected error response`);
    });
  });
});
