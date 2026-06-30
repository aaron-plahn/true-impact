import {
  ClassifyNoteAboutGroupProgramObservation,
  CreateGroupProgram,
  MakeNoteAboutGroupProgramObservation,
  RecordGroupProgramObservationByType,
  ScheduleGroupProgramSession,
} from '../../../features/group-programs/domain/commands';
import { GroupSessionLocationDto } from '../../../features/group-programs/domain/group-session-location.value-object';
import { GroupProgramViewModelClientDto } from '../../../features/group-programs/queries';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
} from '../utils';
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const groupProgramQueryEndpoint = `${baseEndpoint}/group-programs`;

const groupProgramCommandEndpoint = `${baseEndpoint}/group-programs/commands`;

const groupProgramTestSetupEndpoint = `${baseEndpoint}/group-programs/test-setup`;

const programName = "Wreckin' Rollerbladez";

const missingGroupProgramId = 'group-program-id-404';

const missingSessionId = '67';

/**
 * This isn't the focus of the present test, but due to the way our clone with overrides
 * utils work, we have to specify some combination of the location's properties
 * to avoid a missing location for setup commands.
 */
const location: GroupSessionLocationDto = {
  name: 'Community Hall',
  isUrban: false,
};

const scheduleSessions = TestCommandStream.first(CreateGroupProgram, {
  name: programName,
})
  .andThen(ScheduleGroupProgramSession, {
    date: '2026-01-01',
    location,
  })
  .andThen(ScheduleGroupProgramSession, {
    date: '2026-03-05',
    location,
  });

const directlyAssignedInteractionType = 'exclamation';

const noteText = 'The participant squeled in horror.';

const noteLanguageCode = 'en';

const interactionTypeForNoteThatIsClassifiedLater = 'shock';

describe(`Group Program Observation Scenarios`, () => {
  const adminHttpClient = new TestHttpClient('http://localhost:4200');

  beforeAll(async () => {
    await signInAsAdmin(adminHttpClient);
  });

  beforeEach(async () => {
    await adminHttpClient.patch(groupProgramTestSetupEndpoint);
  });

  describe(`when the user has permission to observe the given program`, () => {
    describe(`when recording several observations (Full Happy Path)`, () => {
      it(`should record these observations`, async () => {
        await assertCommandScenarioSuccess({
          httpClient: adminHttpClient,
          endpoint: groupProgramCommandEndpoint,
          stream: scheduleSessions
            .andThen(RecordGroupProgramObservationByType, {
              interactionType: directlyAssignedInteractionType,
              /**
               * This relies on special knowledge of how the IDs are generated.
               * A better approach is to either return this info in the response
               * or to query for this info.
               */
              sessionId: '2',
            })
            .andThen(MakeNoteAboutGroupProgramObservation, {
              sessionId: '2',
              note: {
                text: noteText,
                languageCode: noteLanguageCode,
              },
            })
            .andThen(ClassifyNoteAboutGroupProgramObservation, {
              // see note above about `sessionId`
              observationId: '2',
              interactionType: interactionTypeForNoteThatIsClassifiedLater,
            })
            .andThen(MakeNoteAboutGroupProgramObservation, {
              sessionId: '2',
              note: {
                text: 'other note text',
                languageCode: noteLanguageCode,
              },
            }),
          assertSuccess: async (acks) => {
            const updatedView = (
              await adminHttpClient.get(
                `${groupProgramQueryEndpoint}/${acks[0].id}`,
              )
            ).data as GroupProgramViewModelClientDto;

            // should this be sessionsByDate?
            const targetSession = updatedView.sessions[1];

            const firstObservation = targetSession.observationsById['1'];

            expect(firstObservation).toBeTruthy();

            expect(firstObservation.interactionType).toBe(
              directlyAssignedInteractionType,
            );

            expect(firstObservation.note).toBeUndefined();

            const secondObservation = targetSession.observationsById['2'];

            expect(secondObservation).toBeTruthy();

            expect(secondObservation.note).toBe(noteText);

            // TODO language code

            expect(secondObservation.interactionType).toBe(
              interactionTypeForNoteThatIsClassifiedLater,
            );

            const observationWithOnlyANote =
              targetSession.observationsById['3'];

            expect(observationWithOnlyANote.note).toBeTruthy();

            expect(observationWithOnlyANote.interactionType).toBeUndefined();
          },
        });
      });
    });

    describe(`when the request is invalid`, () => {
      describe(`when adding a note`, () => {
        describe(`when the group program does not exist`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              commandFsa: TestCommandStream.buildOne(
                MakeNoteAboutGroupProgramObservation,
                {
                  aggregateCompositeIdentifier: {
                    id: missingGroupProgramId,
                  },
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(message, 'not found');
              },
            });
          });
        });

        describe(`when the target session does not exist`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: scheduleSessions.andThen(
                MakeNoteAboutGroupProgramObservation,
                {
                  sessionId: missingSessionId,
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  missingSessionId,
                  'no such session',
                  programName,
                );
              },
            });
          });
        });

        describe(`when the note's text is empty`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: scheduleSessions.andThen(
                MakeNoteAboutGroupProgramObservation,
                {
                  sessionId: '1',
                  note: {
                    text: '',
                  },
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  'text',
                  'Expected non-empty text',
                );
              },
            });
          });
        });
      });

      describe(`when recording an interaction by type`, () => {
        describe(`when the group program does not exist`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              commandFsa: TestCommandStream.buildOne(
                RecordGroupProgramObservationByType,
                {
                  aggregateCompositeIdentifier: {
                    id: missingGroupProgramId,
                  },
                },
              ),

              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(message, 'not found');
              },
            });
          });
        });

        describe(`when the target session does not exist`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: scheduleSessions.andThen(
                RecordGroupProgramObservationByType,
                {
                  sessionId: missingSessionId,
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  missingSessionId,
                  'no such session',
                  programName,
                );
              },
            });
          });
        });

        describe(`when the interaction type is empty`, () => {
          it(`return the expected error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: scheduleSessions.andThen(
                RecordGroupProgramObservationByType,
                {
                  interactionType: '',
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  // it would be nice to include this
                  // programName,
                  'interactionType',
                  'non-empty text',
                );
              },
            });
          });
        });
      });

      describe(`when classifying an existing interaction that is the subject of a note`, () => {
        describe(`when the group program does not exist`, () => {
          it(`should return an error`, async () => {
            await assertCommandError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              commandFsa: TestCommandStream.buildOne(
                ClassifyNoteAboutGroupProgramObservation,
                {
                  aggregateCompositeIdentifier: {
                    id: missingGroupProgramId,
                  },
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(message, 'not found');
              },
            });
          });
        });

        describe(`when the target session does not exist`, () => {
          it(`should return an error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: scheduleSessions.andThen(
                ClassifyNoteAboutGroupProgramObservation,
                {
                  sessionId: missingSessionId,
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  'no such session',
                  missingSessionId,
                  programName,
                );
              },
            });
          });
        });

        describe(`when the target observation does not exist`, () => {
          const missingObservationId = '404';

          const sessionId = '1';

          const interactionType = 'neutral response';

          it(`should return an error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: scheduleSessions.andThen(
                ClassifyNoteAboutGroupProgramObservation,
                {
                  sessionId,
                  observationId: missingObservationId,
                  interactionType,
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  'cannot classify',
                  interactionType,
                  missingObservationId,
                  'no such observation',
                );
              },
            });
          });
        });
      });
    });
  });

  // note that we test route guards in the `schedule-group-sessions.scenario` test
});
