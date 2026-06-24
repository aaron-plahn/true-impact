import { HttpStatus } from '@nestjs/common';
import { GroupSessionLocationDto } from 'src/features/group-programs/domain/group-session-location.value-object';
import { GroupProgramViewModel } from 'src/features/group-programs/queries';
import {
  CreateGroupProgram,
  ScheduleGroupProgramSession,
} from '../../../features/group-programs/domain/commands';
import { CreateUserWithPassword } from '../../../features/users/commands';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
} from '../utils';
import { signIn, signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const groupProgramQueryEndpoint = `${baseEndpoint}/group-programs`;

const groupProgramCommandEndpoint = `${baseEndpoint}/group-programs/commands`;

const groupProgramTestSetupEndpoint = `${baseEndpoint}/group-programs/test-setup`;

const programName = "Wreckin' Rollerbladez";

const missingId = 'group-program-id-404';

describe(`Group Program Scheduling Scenarios`, () => {
  const adminHttpClient = new TestHttpClient('http://localhost:4200');

  beforeAll(async () => {
    await signInAsAdmin(adminHttpClient);
  });

  beforeEach(async () => {
    await adminHttpClient.patch(groupProgramTestSetupEndpoint);
  });

  describe(`when the user is authenticated as admin`, () => {
    describe(`when creating a group program`, () => {
      describe(`when the request is valid`, () => {
        it(`should create the group program`, async () => {
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: groupProgramCommandEndpoint,
            stream: TestCommandStream.first(CreateGroupProgram, {
              name: programName,
            }),
            assertSuccess: async (acks) => {
              const { id } = acks[0];

              const result = await adminHttpClient.get(
                `${groupProgramQueryEndpoint}/${id}`,
              );

              expect(result.status).toBe(HttpStatus.OK);
            },
          });
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when the name is omitted`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: TestCommandStream.first(CreateGroupProgram, {
                // TODO explicitly check '' as well
                name: undefined,
              }),
              assertErrorMessageAsExpected: (message) => {
                expect(message).toContain(`required`);
                expect(message).toContain('name');
              },
            });
          });
        });

        describe(`when the name is already in use by another program`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: TestCommandStream.first(CreateGroupProgram, {
                name: programName,
              }),
            });

            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: TestCommandStream.first(CreateGroupProgram, {
                name: programName,
              }),
              assertErrorMessageAsExpected: (message) => {
                expect(message).toContain(programName);
                expect(message).toContain('already in use');
              },
            });
          });
        });
      });
    });

    describe(`when scheduling a first session`, () => {
      describe(`when the request is valid`, () => {
        const sessionDate = '2026-01-02'; // TODO update the date format

        const sessionLocation: GroupSessionLocationDto = {
          name: 'Big Field',
          isUrban: false,
        };

        it(`should schedule the session`, async () => {
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: groupProgramCommandEndpoint,
            // TOOO make {} default for the overrides in `first`
            stream: TestCommandStream.first(CreateGroupProgram, {}).andThen(
              ScheduleGroupProgramSession,
              {
                date: sessionDate,
                location: sessionLocation,
              },
            ),
            assertSuccess: async (acks) => {
              const { id } = acks[0];

              const searchResult = (
                await adminHttpClient.get(`${groupProgramQueryEndpoint}/${id}`)
              ).data as GroupProgramViewModel;

              expect(searchResult.sessions).toHaveLength(1);
            },
          });
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when the group program does not exist`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              commandFsa: TestCommandStream.buildOne(
                ScheduleGroupProgramSession,
                {
                  aggregateCompositeIdentifier: {
                    id: missingId,
                  },
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  `no such program`,
                  `cannot schedule`,
                  missingId,
                );
              },
            });
          });
        });

        describe(`when a community is specified as the location`, () => {
          it(`should return a not implemented error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: TestCommandStream.first(CreateGroupProgram).andThen(
                ScheduleGroupProgramSession,
                {
                  location: {
                    communityId: '555',
                  },
                },
              ),
            });
          });
        });

        describe(`when specifying a location by name but omittiing "isUrban"`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: TestCommandStream.first(CreateGroupProgram).andThen(
                ScheduleGroupProgramSession,
                {
                  location: {
                    name: 'My Test Location',
                  },
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(message, 'You must specify', 'isUrban');
              },
            });
          });
        });

        describe(`when specifying isUrban but omitting the location name`, () => {
          it(`should return the expected error`, async () => {
            await assertCommandScenarioError({
              httpClient: adminHttpClient,
              endpoint: groupProgramCommandEndpoint,
              stream: TestCommandStream.first(CreateGroupProgram).andThen(
                ScheduleGroupProgramSession,
                {
                  location: {
                    /**
                     * It's better to use `false` than `true` here because someone
                     * might accidentally use `!isUrban` instead of `!isBoolean(isUrban)`
                     * (JS foot gun).
                     */
                    isUrban: false,
                  },
                },
              ),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(message, 'You must specify', 'name');
              },
            });
          });
        });
      });
    });
  });

  describe(`when the user is authenticated as an ordinary user (no RBAC to execute commands)`, () => {
    const userHttpClient = new TestHttpClient('http://localhost:4200');

    const ordinaryUsername = 'duser';

    const ordinaryUserPassword = 'abc123';

    beforeAll(async () => {
      await adminHttpClient.patch(`${baseEndpoint}/users/test-setup`);

      await assertCommandScenarioSuccess({
        httpClient: adminHttpClient,
        endpoint: `${baseEndpoint}/users/commands`,
        stream: TestCommandStream.first(CreateUserWithPassword, {
          username: ordinaryUsername,
          password: ordinaryUserPassword,
          email: 'duser@mytenant.org',
        }),
      });

      await signIn(
        {
          username: ordinaryUsername,
          password: ordinaryUserPassword,
        },
        userHttpClient,
      );
    });

    it(`should return forbidden`, async () => {
      await assertCommandScenarioError({
        endpoint: groupProgramCommandEndpoint,
        stream: TestCommandStream.first(CreateGroupProgram, {}),
        assertErrorMessageAsExpected: (message) => {
          expect(message).toContain('Forbidden');
        },
      });
    });
  });
});
