import { GroupSessionLocationDto } from 'src/features/group-programs/domain/group-session-location.value-object';
import {
  ClassifyNoteAboutGroupProgramObservation,
  CreateGroupProgram,
  MakeNoteAboutGroupProgramObservation,
  RecordGroupProgramObservationByType,
  ScheduleGroupProgramSession,
} from '../../../features/group-programs/domain/commands';
import { GroupProgramViewModelClientDto } from '../../../features/group-programs/queries';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertCommandScenarioSuccess } from '../utils';
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const groupProgramQueryEndpoint = `${baseEndpoint}/group-programs`;

const groupProgramCommandEndpoint = `${baseEndpoint}/group-programs/commands`;

const groupProgramTestSetupEndpoint = `${baseEndpoint}/group-programs/test-setup`;

const programName = "Wreckin' Rollerbladez";

const missingId = 'group-program-id-404';

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

  describe(`when the user has permission to observe the given program`, () => {
    describe(`when recording several observations`, () => {
      beforeAll(async () => {
        await signInAsAdmin(adminHttpClient);
      });

      beforeEach(async () => {
        await adminHttpClient.patch(groupProgramTestSetupEndpoint);
      });

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
            }),
          assertSuccess: async (acks) => {
            const updatedView = (
              await adminHttpClient.get(
                `${groupProgramQueryEndpoint}/${acks[0].id}`,
              )
            ).data as GroupProgramViewModelClientDto;

            // should this be sessionsByDate?
            const targetSession = updatedView.sessions[1];

            console.log({
              observationsById: JSON.stringify(targetSession.observationsById),
            });

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

            // TODO check a third observation that only has a note
          },
        });
      });
    });
  });

  describe(`when the user does not have permission to observe the given program`, () => {
    it.todo(`should return forbidden`);
  });
});
