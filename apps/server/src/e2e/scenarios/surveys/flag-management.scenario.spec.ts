import { HttpStatusCode } from 'axios';
import { CreateFlag, RelabelFlag } from '../../../features/flags/commands';
import { FlagViewModel } from '../../../features/flags/queries';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
  assertCommandSuccess,
} from '../utils';
import { assertCommandAccessDeniedToUser } from '../utils/assert-command-access-denied-to-user';
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

// TODO From env.e2e
const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const flagIndexEndpoint = `${baseEndpoint}/flags`;

const flagTestSetupEndpoint = `${flagIndexEndpoint}/test-setup`;

const flagCommandsEndpoint = `${flagIndexEndpoint}/commands`;

const firstLabel = 'dangerous to others';

const uniqueUpdatedLabel = 'May Harm Others';

const createFlag = TestCommandStream.first(CreateFlag, {
  label: firstLabel,
});

const relabelFlag = createFlag.andThen(RelabelFlag, {
  newLabel: uniqueUpdatedLabel,
});

const repeatedFlagLabel = 'I did it again';

const httpClient = new TestHttpClient('http://localhost:4200');

/**
 * TODO Add test cases for
 * - public user (unauthorized)
 * - each non-admin role (unauthorized)
 */

/**
 * Note that where flags can be applied in specific workflows (e.g., survey completion), those use cases are tested
 * in the corresponding scenarios.
 */
describe(`Flag Management Scenarios`, () => {
  describe(`when the user is authenitcated as an admin`, () => {
    beforeAll(async () => {
      await signInAsAdmin(httpClient);
    });

    beforeEach(async () => {
      await httpClient.patch(flagTestSetupEndpoint);
    });

    describe(`when creating a flag`, () => {
      describe(`when  creating a first flag`, () => {
        it(`should create the flag`, async () => {
          await assertCommandScenarioSuccess({
            httpClient,
            endpoint: flagCommandsEndpoint,
            stream: createFlag,
            assertSuccess: async (acks) => {
              const searchResponse = await httpClient.get(
                `${flagIndexEndpoint}/${acks[0].id}`,
              );

              expect(searchResponse.status).toBe(HttpStatusCode.Ok);

              const newFlag = searchResponse.data as FlagViewModel;

              expect(newFlag.label).toBe(firstLabel);
            },
          });
        });
      });

      describe(`when creating a second flag`, () => {
        describe(`when the label is unique`, () => {
          it(`should have a test`, async () => {
            // Arrange
            await assertCommandSuccess({
              httpClient,
              endpoint: flagCommandsEndpoint,
              commandFsa: TestCommandStream.buildOne(CreateFlag, {
                label: firstLabel,
              }),
            });

            await assertCommandSuccess({
              httpClient,
              endpoint: flagCommandsEndpoint,
              commandFsa: TestCommandStream.buildOne(CreateFlag, {
                label: 'new label',
              }),
              assertSuccess: async () => {
                const indexResult = (await httpClient.get(flagIndexEndpoint))
                  .data as FlagViewModel[];

                expect(indexResult).toHaveLength(2);
              },
            });
          });
        });

        describe(`when the label is already in use`, () => {
          describe(`because another flag was created with this label`, () => {
            it(`should return the expected error response`, async () => {
              // Arrange
              await assertCommandScenarioSuccess({
                httpClient,
                endpoint: flagCommandsEndpoint,
                stream: createFlag,
              });

              // Act \ Assert
              await assertCommandScenarioError({
                httpClient,
                endpoint: flagCommandsEndpoint,
                stream: createFlag,
                assertErrorMessageAsExpected: (message) => {
                  assertTextMatchesAll(
                    message,
                    firstLabel,
                    'Uniqueness constraint violated',
                  );
                },
              });
            });
          });

          describe(`because another flag was relabelled to have this label`, () => {
            it(`should return the epxected error response`, async () => {
              // Arrange
              await assertCommandScenarioSuccess({
                httpClient,
                endpoint: flagCommandsEndpoint,
                stream: createFlag.andThen(RelabelFlag, {
                  newLabel: repeatedFlagLabel,
                }),
              });

              // Act \ Assert
              await assertCommandScenarioError({
                httpClient,
                endpoint: flagCommandsEndpoint,
                stream: TestCommandStream.first(CreateFlag, {
                  label: 'ok label',
                }).andThen(RelabelFlag, {
                  newLabel: repeatedFlagLabel,
                }),
                assertErrorMessageAsExpected: (message) => {
                  assertTextMatchesAll(
                    message,
                    repeatedFlagLabel,
                    'Uniqueness constraint violated',
                    'label',
                  );
                },
              });
            });
          });
        });
      });
    });

    describe(`when relabelling a flag`, () => {
      describe(`when the target flag exists`, () => {
        describe(`when the new label is unique`, () => {
          it(`should update the flag`, async () => {
            await assertCommandScenarioSuccess({
              httpClient,
              endpoint: flagCommandsEndpoint,
              stream: relabelFlag,
              assertSuccess: async (acks) => {
                const updated = (
                  await httpClient.get(`${flagIndexEndpoint}/${acks[0].id}`)
                ).data as FlagViewModel;

                expect(updated.label).toBe(uniqueUpdatedLabel);
              },
            });
          });
        });

        describe(`when the new label is already in use`, () => {
          describe(`by another flag`, () => {
            describe(`that was created with this label`, () => {
              it(`should return the expected error response`, async () => {
                // Arrange
                await assertCommandSuccess({
                  httpClient,
                  endpoint: flagCommandsEndpoint,
                  commandFsa: TestCommandStream.buildOne(CreateFlag, {
                    label: repeatedFlagLabel,
                  }),
                });

                // Act \ Assert
                await assertCommandScenarioError({
                  httpClient,
                  endpoint: flagCommandsEndpoint,
                  stream: createFlag.andThen(RelabelFlag, {
                    newLabel: repeatedFlagLabel,
                  }),
                  assertErrorMessageAsExpected: (message) => {
                    assertTextMatchesAll(
                      message,
                      repeatedFlagLabel,
                      'Uniqueness constraint violated',
                      'label',
                    );
                  },
                });
              });
            });

            describe(`that was relabelled to have this label`, () => {
              it(`should return the expected error resposne`, async () => {
                await assertCommandScenarioSuccess({
                  httpClient,
                  endpoint: flagCommandsEndpoint,
                  stream: TestCommandStream.first(CreateFlag, {
                    label: 'some other label',
                  }).andThen(RelabelFlag, {
                    newLabel: repeatedFlagLabel,
                  }),
                });

                await assertCommandScenarioError({
                  httpClient,
                  endpoint: flagCommandsEndpoint,
                  stream: TestCommandStream.first(CreateFlag, {
                    label: 'no problem here',
                  }).andThen(RelabelFlag, {
                    newLabel: repeatedFlagLabel,
                  }),
                  assertErrorMessageAsExpected: (message) => {
                    assertTextMatchesAll(
                      message,
                      repeatedFlagLabel,
                      'Uniqueness constraint violated',
                      'label',
                    );
                  },
                });
              });
            });
          });

          describe(`by the target flag`, () => {
            it(`should return the expected error response`, async () => {
              await assertCommandScenarioError({
                httpClient,
                endpoint: flagCommandsEndpoint,
                stream: createFlag
                  .andThen(RelabelFlag, {
                    newLabel: repeatedFlagLabel,
                  })
                  .andThen(RelabelFlag, {
                    newLabel: repeatedFlagLabel,
                  }),
                assertErrorMessageAsExpected: (message) => {
                  assertTextMatchesAll(
                    message,
                    repeatedFlagLabel,
                    'already has',
                  );
                },
              });
            });
          });
        });
      });

      describe(`when the target flag does not exist`, () => {
        it(`should return the expected error response`, async () => {
          const missingId = '555';

          await assertCommandError({
            httpClient,
            endpoint: flagCommandsEndpoint,
            commandFsa: TestCommandStream.buildOne(RelabelFlag, {
              aggregateCompositeIdentifier: {
                id: missingId,
              },
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                missingId,
                'cannot relabel',
                'no such flag',
              );
            },
          });
        });
      });
    });
  });

  describe(`when the user does not have role-based access to execute commands`, () => {
    describe(`when the user is not authenticated`, () => {
      it(`should return forbidden`, async () => {
        await assertCommandAccessDeniedToUser({
          endpoint: flagCommandsEndpoint,
          user: undefined,
        });
      });
    });

    describe(`when the user is an ordinary user`, () => {
      it(`should return forbidden`, async () => {
        await assertCommandAccessDeniedToUser({
          endpoint: flagCommandsEndpoint,
          user: {
            credentials: {
              username: 'testemployee',
              password: 'testemployeePASSWORD1',
            },
            role: 'employee',
          },
        });
      });
    });
  });
});
