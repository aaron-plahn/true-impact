import {
  ClassifyNoteAboutGroupProgramObservation,
  CreateGroupProgram,
  MakeNoteAboutGroupProgramObservation,
  RecordGroupProgramObservationByType,
  ScheduleGroupProgramSession,
} from 'src/features/group-programs/domain/commands';
import { GroupProgramViewModel } from 'src/features/group-programs/queries';
import { TestCommandStream } from 'src/libs/cqrs-es';
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

const scheduleSessions = TestCommandStream.first(CreateGroupProgram, {
  name: programName,
})
  .andThen(ScheduleGroupProgramSession, {
    date: '2026-01-01',
  })
  .andThen(ScheduleGroupProgramSession, {
    date: '2026-03-01',
  });

const directlyAssignedInteractionType = 'exclamation';

const noteText = 'The participant squeled in horror.';

const noteLanguageCode = 'en';

const interactionTypeForNoteThatIsClassifiedLater = 'shock';

describe(`Group Program Observation Scenarios`, () => {
  const adminHttpClient = new TestHttpClient('http://localhost:4200');

  describe(`when recording several observations`, () => {
    beforeAll(async () => {
      await signInAsAdmin(adminHttpClient);
    });

    it(`should record these observations`, async () => {
      await assertCommandScenarioSuccess({
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
          ).data as GroupProgramViewModel;

          expect(updatedView);
        },
      });
    });
  });
});
