import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CreateUser } from '../../../features/users/commands/create-user.command';
import { DeactivateTiSystemUser } from '../../../features/users/commands/deactivate-user.command';
import { GrantUserRole } from '../../../features/users/commands/grant-user-role.command';
import { UserViewModel } from '../../../features/users/queries';
import { TiUserRole } from '../../../features/users/types';
import { TestCommandStream } from '../../../libs/cqrs-es';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
} from '../utils';

const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const userCommandsEndpoint = `${baseEndpoint}/users/commands`;

const userQueryEndpoint = `${baseEndpoint}/users`;

const userTestSetupEndpoint = `${baseEndpoint}/users/test-setup`;

// should we get by username instead?
const buildUserDetailEndpoint = (id: string) => `${userQueryEndpoint}/${id}`;

const testUsername = 'bboy123';

const testUserFirstName = 'Bill';

const testUserLastName = 'Boy';

const missingUserId = 'MissingUserId';

describe('User Management Scenarios', () => {
  beforeEach(async () => {
    await axios.patch(userTestSetupEndpoint);
  });

  describe(`When creating a new user`, () => {
    describe(`When the username is available`, () => {
      describe(`When the system user is authorized to create new users`, () => {
        describe(`when the user is a tenant admin`, () => {
          it(`should create the user`, async () => {
            await assertCommandScenarioSuccess({
              endpoint: userCommandsEndpoint,
              stream: TestCommandStream.first(CreateUser, {
                username: testUsername,
                firstName: testUserFirstName,
                lastName: testUserLastName,
              }),
              assertSuccess: async (acks) => {
                const { id } = acks[0];

                const queryResult = await axios.get(
                  buildUserDetailEndpoint(id),
                );

                expect(queryResult.status).not.toBe(HttpStatus.NOT_FOUND);

                const foundView = queryResult.data as UserViewModel;

                expect(foundView.username).toBe(testUsername);

                // This is the lowest privilige level role
                // TODO start with 'no permissions' role?
                expect(foundView.role).toBe('employee');
              },
            });
          });
        });
      });
    });
  });

  describe(`When granting a role to a user`, () => {
    describe(`when the user exists`, () => {
      describe(`when the user currently has a different role`, () => {
        const newRole: TiUserRole = 'tenant admin';

        it(`should grant the user the new role`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: userCommandsEndpoint,
            stream: TestCommandStream.first(CreateUser, {}).andThen(
              GrantUserRole,
              {
                role: newRole,
              },
            ),
            assertSuccess: async (acks) => {
              const { id } = acks[0];

              const updatedUserView = (
                await axios.get(buildUserDetailEndpoint(id))
              ).data as UserViewModel;

              expect(updatedUserView.role).toBe(newRole);
            },
          });
        });
      });

      describe(`when the user already has the given role`, () => {
        it(`should return the expected error response`, async () => {
          const redundantRole: TiUserRole = 'tenant admin';

          await assertCommandScenarioError({
            endpoint: userCommandsEndpoint,
            stream: TestCommandStream.first(CreateUser, {
              username: testUsername,
            })
              .andThen(GrantUserRole, {
                role: redundantRole,
              })
              .andThen(GrantUserRole, {
                role: redundantRole,
              }),

            assertErrorMessageAsExpected: (message) => {
              expect(message).toContain(redundantRole);
              expect(message).toContain(testUsername);
              expect(message).toContain('already has');
            },
          });
        });
      });
    });

    describe(`when the user does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandError({
          endpoint: userCommandsEndpoint,
          commandFsa: TestCommandStream.buildOne(GrantUserRole, {
            aggregateCompositeIdentifier: {
              id: missingUserId,
            },
          }),
          assertErrorMessageAsExpected: (message) => {
            expect(message).toContain(missingUserId);

            expect(message).toContain('no user with that ID');
          },
        });
      });
    });
  });

  describe(`When deactivating a user`, () => {
    describe(`when the user exists`, () => {
      describe(`when the user is currently active`, () => {
        it(`should deactivate the user`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: userCommandsEndpoint,
            // shouldn't the second arg here default to {}?
            stream: TestCommandStream.first(CreateUser, {}).andThen(
              DeactivateTiSystemUser,
              {},
            ),
          });
        });
      });

      describe(`when the user has already been deactivated`, () => {
        it(`should return the expected error`, async () => {
          await assertCommandScenarioError({
            endpoint: userCommandsEndpoint,
            stream: TestCommandStream.first(CreateUser, {
              username: testUsername,
            })
              .andThen(DeactivateTiSystemUser, {})
              .andThen(DeactivateTiSystemUser, {}),
            assertErrorMessageAsExpected: (message) => {
              expect(message).toContain('cannot deactivate');
              expect(message).toContain(testUsername);
              expect(message).toContain('already');
            },
          });
        });
      });
    });

    describe(`when the user does not exist`, () => {
      it(`should return the expected error`, async () => {
        await assertCommandError({
          endpoint: userCommandsEndpoint,
          commandFsa: TestCommandStream.buildOne(DeactivateTiSystemUser, {
            aggregateCompositeIdentifier: {
              id: missingUserId,
            },
          }),
          assertErrorMessageAsExpected: (message) => {
            expect(message).toContain(missingUserId);

            expect(message).toContain('cannot deactivate');

            expect(message).toContain('no such user');
          },
        });
      });
    });
  });
});
