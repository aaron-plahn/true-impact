import { HttpStatus } from '@nestjs/common';
import { CreateGroupProgram } from '../../../features/group-programs/domain/commands';
import { CreateUserWithPassword } from '../../../features/users/commands';
import { TestCommandStream } from '../../../libs/cqrs-es';
import {
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

describe(`Group Program Scheduling Scenarios`, () => {
  const adminHttpClient = new TestHttpClient('http://localhost:3234');

  beforeEach(async () => {
    await adminHttpClient.patch(groupProgramTestSetupEndpoint);
  });

  describe(`when the user is authenticated as admin`, () => {
    beforeAll(async () => {
      await signInAsAdmin(adminHttpClient);
    });

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
