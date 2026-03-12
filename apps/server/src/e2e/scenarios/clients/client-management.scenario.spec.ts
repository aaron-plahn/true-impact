import axios from 'axios';
import { Client } from '../../../features/clients/client.aggregate-root';
import { CreateClient } from '../../../features/clients/commands/create-client.command';
import { FlagClient } from '../../../features/clients/commands/flag-client.command';
import { CreateCommunity } from '../../../features/communities/commands';
import { CommunityViewModel } from '../../../features/communities/queries';
import { CreateFlag } from '../../../features/flags/commands';
import { FlagViewModelClientDto } from '../../../features/flags/queries';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
  assertCommandSuccess,
} from '../utils';

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const clientIndexEndpoint = `${baseEndpoint}/clients`;

const commandsEndpointForClients = `${clientIndexEndpoint}/commands`;

const clientTestSetupEndpoint = `${clientIndexEndpoint}/test-setup`;

const communityIndexEndpoint = `${baseEndpoint}/communities`;

const commandsEndpointForCommunities = `${communityIndexEndpoint}/commands`;

const communityTestSetupEndpoint = `${communityIndexEndpoint}/test-setup`;

const flagIndexEndpoint = `${baseEndpoint}/flags`;

const flagTestSetupEndpoint = `${flagIndexEndpoint}/test-setup`;

const flagCommandsEndpoint = `${flagIndexEndpoint}/commands`;

const clientFirstName = 'Bill';

const clientLastName = 'Collector';

const missingFlagId = 'fl-404';

const missingClientId = 'cl-404';

describe(`Client Management Scenarios`, () => {
  let communityId: string;

  let flagId: string;

  const secondFlagLabel = 'second flag label';

  let secondFlagId: string;

  beforeEach(async () => {
    await axios.patch(clientTestSetupEndpoint);

    await axios.patch(communityTestSetupEndpoint);

    await axios.patch(flagTestSetupEndpoint);

    await assertCommandSuccess({
      endpoint: commandsEndpointForCommunities,
      commandFsa: TestCommandStream.buildOne(CreateCommunity, {}),
    });

    communityId = (
      (await axios.get(communityIndexEndpoint)).data as CommunityViewModel[]
    )[0].id;

    await assertCommandSuccess({
      endpoint: flagCommandsEndpoint,
      commandFsa: TestCommandStream.buildOne(CreateFlag, {}),
    });

    flagId = (
      (await axios.get(flagIndexEndpoint)).data as CommunityViewModel[]
    )[0].id;

    await assertCommandSuccess({
      endpoint: flagCommandsEndpoint,
      commandFsa: TestCommandStream.buildOne(CreateFlag, {
        label: secondFlagLabel,
      }),
    });

    const allFlags = (await axios.get(flagIndexEndpoint))
      .data as FlagViewModelClientDto[];

    secondFlagId = allFlags.find((f) => f.label === secondFlagLabel)
      ?.id as string;
  });

  describe(`when the client's home community is valid`, () => {
    describe(`when flagging a client`, () => {
      describe(`when the client exists`, () => {
        describe(`when the target flag exists`, () => {
          describe(`when the client has no flags to start with`, () => {
            it(`should add a first flag`, async () => {
              await assertCommandScenarioSuccess({
                endpoint: commandsEndpointForClients,
                stream: TestCommandStream.first(CreateClient, {
                  community: communityId,
                }).andThen(FlagClient, {
                  flagId,
                }),
                assertSuccess: async (acks) => {
                  const updated = (
                    await axios.get(`${clientIndexEndpoint}/${acks[0].id}`)
                  ).data as Client; // use a view model - ClientViewModelClientDto

                  expect(updated.flagIds).toContain(flagId);
                },
              });
            });
          });

          describe(`when the client already has some flags`, () => {
            describe(`when the new flag is distinct from existing flags`, () => {
              it(`should add the additional flag`, async () => {
                await assertCommandScenarioSuccess({
                  endpoint: commandsEndpointForClients,
                  stream: TestCommandStream.first(CreateClient, {
                    community: communityId,
                    firstName: clientFirstName,
                  })
                    .andThen(FlagClient, {
                      flagId,
                    })
                    .andThen(FlagClient, {
                      flagId: secondFlagId,
                    }),
                });
              });
            });

            describe(`when the client already has the given flag`, () => {
              it(`should return the expected error response`, async () => {
                await assertCommandScenarioError({
                  endpoint: commandsEndpointForClients,
                  stream: TestCommandStream.first(CreateClient, {
                    community: communityId,
                    firstName: clientFirstName,
                    lastName: clientLastName,
                  })
                    .andThen(FlagClient, {
                      flagId,
                    })
                    .andThen(FlagClient, {
                      flagId,
                    }),
                  assertErrorMessageAsExpected: (message) => {
                    assertTextMatchesAll(
                      message,
                      clientFirstName,
                      clientLastName,
                      'already',
                      flagId,
                    );
                  },
                });
              });
            });
          });
        });

        describe(`when the target flag does not exist`, () => {
          it(`should return the expected error response`, async () => {
            await assertCommandScenarioError({
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                firstName: clientFirstName,
                lastName: clientLastName,
              }).andThen(FlagClient, {
                flagId: missingFlagId,
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  'cannot flag',
                  'no such flag',
                  missingFlagId,
                );
              },
            });
          });
        });
      });

      describe(`when the client does not exist`, () => {
        it(`should return the expected error response`, async () => {
          await assertCommandError({
            endpoint: commandsEndpointForClients,
            commandFsa: TestCommandStream.buildOne(FlagClient, {
              aggregateCompositeIdentifier: {
                id: missingClientId,
              },
              flagId,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(message, missingClientId, 'no such client');
            },
          });
        });
      });
    });
  });
});
