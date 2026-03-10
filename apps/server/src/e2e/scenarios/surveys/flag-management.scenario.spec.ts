import axios, { HttpStatusCode } from 'axios';
import { CreateFlag, RelabelFlag } from '../../../features/flags/commands';
import { FlagViewModel } from '../../../features/flags/queries';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandStreamError,
  assertCommandSuccess,
  assertScenarioSuccess,
} from '../utils';

// TODO From env.e2e
const port = '3001';

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

/**
 * Note that where flags can be applied in specific workflows (e.g., survey completion), those use cases are tested
 * in the corresponding scenarios.
 */
describe(`Flag Management Scenarios`, () => {
  beforeEach(async () => {
    await axios.patch(flagTestSetupEndpoint);
  });

  describe(`when creating a flag`, () => {
    describe(`when  creating a first flag`, () => {
      it(`should create the flag`, async () => {
        // todo name these helpers consistently now
        await assertScenarioSuccess({
          endpoint: flagCommandsEndpoint,
          stream: createFlag,
          assertSuccess: async (acks) => {
            const searchResponse = await axios.get(
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
            endpoint: flagCommandsEndpoint,
            commandFsa: TestCommandStream.buildOne(CreateFlag, {
              label: firstLabel,
            }),
          });

          await assertCommandSuccess({
            endpoint: flagCommandsEndpoint,
            commandFsa: TestCommandStream.buildOne(CreateFlag, {
              label: 'new label',
            }),
            assert: async () => {
              const indexResult = (await axios.get(flagIndexEndpoint))
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
            await assertScenarioSuccess({
              endpoint: flagCommandsEndpoint,
              stream: createFlag,
            });

            // Act \ Assert
            await assertCommandStreamError({
              endpoint: flagCommandsEndpoint,
              stream: createFlag,
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(message, firstLabel, 'already in use');
              },
            });
          });
        });

        describe(`because another flag was relabelled to have this label`, () => {
          it(`should return the epxected error response`, async () => {
            // Arrange
            await assertScenarioSuccess({
              endpoint: flagCommandsEndpoint,
              stream: createFlag.andThen(RelabelFlag, {
                newLabel: repeatedFlagLabel,
              }),
            });

            // Act \ Assert

            await assertCommandStreamError({
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
                  'already in use',
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
          await assertScenarioSuccess({
            endpoint: flagCommandsEndpoint,
            stream: relabelFlag,
            assertSuccess: async (acks) => {
              const updated = (
                await axios.get(`${flagIndexEndpoint}/${acks[0].id}`)
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
                endpoint: flagCommandsEndpoint,
                commandFsa: TestCommandStream.buildOne(CreateFlag, {
                  label: repeatedFlagLabel,
                }),
              });

              // Act \ Assert
              await assertCommandStreamError({
                endpoint: flagCommandsEndpoint,
                stream: createFlag.andThen(RelabelFlag, {
                  newLabel: repeatedFlagLabel,
                }),
                assertErrorMessageAsExpected: (message) => {
                  assertTextMatchesAll(
                    message,
                    repeatedFlagLabel,
                    'already in use',
                  );
                },
              });
            });
          });

          describe(`that was relabelled to have this label`, () => {
            it(`should return the expected error resposne`, async () => {
              await assertScenarioSuccess({
                endpoint: flagCommandsEndpoint,
                stream: TestCommandStream.first(CreateFlag, {
                  label: 'some other label',
                }).andThen(RelabelFlag, {
                  newLabel: repeatedFlagLabel,
                }),
              });

              await assertCommandStreamError({
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
                    'already in use',
                  );
                },
              });
            });
          });
        });

        describe(`by the target flag`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandStreamError({
              endpoint: flagCommandsEndpoint,
              stream: createFlag
                .andThen(RelabelFlag, {
                  newLabel: repeatedFlagLabel,
                })
                .andThen(RelabelFlag, {
                  newLabel: repeatedFlagLabel,
                }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(message, repeatedFlagLabel, 'already has');
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
