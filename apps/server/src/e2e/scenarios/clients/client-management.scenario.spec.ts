import { AddCommunityAffiliationForClient } from '../../../features/clients/commands/add-community-affiliation-for-client';
import { CreateClient } from '../../../features/clients/commands/create-client.command';
import { FlagClient } from '../../../features/clients/commands/flag-client.command';
import { ClientViewModelClientDto } from '../../../features/clients/queries';
import { CreateCommunity } from '../../../features/communities/commands';
import {
  CommunityViewModel,
  CommunityViewModelClientDto,
} from '../../../features/communities/queries';
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
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

// TODO From env.e2e
const port = '3234';

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

const flagLabel = 'soft spoken';

const missingFlagId = 'fl-404';

const missingClientId = 'cl-404';

const missingCommunityId = 'comm-404';

const httpClient = new TestHttpClient('http://localhost:4200');

describe(`Client Management Scenarios`, () => {
  let communityId: string;

  let flagId: string;

  const secondFlagLabel = 'second flag label';

  let secondFlagId: string;

  beforeAll(async () => {
    await signInAsAdmin(httpClient);
  });

  beforeEach(async () => {
    await httpClient.patch(clientTestSetupEndpoint);

    await httpClient.patch(communityTestSetupEndpoint);

    await httpClient.patch(flagTestSetupEndpoint);

    await assertCommandSuccess({
      httpClient,
      endpoint: commandsEndpointForCommunities,
      commandFsa: TestCommandStream.buildOne(CreateCommunity, {}),
    });

    communityId = (
      (await httpClient.get(communityIndexEndpoint))
        .data as CommunityViewModel[]
    )[0].id;

    await assertCommandSuccess({
      httpClient,
      endpoint: flagCommandsEndpoint,
      commandFsa: TestCommandStream.buildOne(CreateFlag, {
        label: flagLabel,
      }),
    });

    flagId = (
      (await httpClient.get(flagIndexEndpoint)).data as CommunityViewModel[]
    )[0].id;

    await assertCommandSuccess({
      httpClient,
      endpoint: flagCommandsEndpoint,
      commandFsa: TestCommandStream.buildOne(CreateFlag, {
        label: secondFlagLabel,
      }),
    });

    const allFlags = (await httpClient.get(flagIndexEndpoint))
      .data as FlagViewModelClientDto[];

    secondFlagId = allFlags.find((f) => f.label === secondFlagLabel)
      ?.id as string;
  });

  describe(`when creating a client`, () => {
    describe(`when the client is marked as indigenous`, () => {
      describe(`when no community is provided`, () => {
        it(`should create the client`, async () => {
          await assertCommandSuccess({
            httpClient,
            endpoint: commandsEndpointForClients,
            commandFsa: TestCommandStream.buildOne(CreateClient, {
              isIndigenous: 'Yes',
              communityId: undefined,
              firstName: clientFirstName,
              lastName: clientLastName,
            }),
            assertSuccess: async (ack) => {
              const updated = (
                await httpClient.get(`${clientIndexEndpoint}/${ack.id}`)
              ).data as ClientViewModelClientDto;

              expect(updated.community?.id).toBe(undefined);

              expect(updated.isIndigenous).toBe('Yes');

              expect(updated.fullName.firstName).toBe(clientFirstName);

              expect(updated.fullName.lastName).toBe(clientLastName);
            },
          });
        });
      });

      describe(`when a community is provided`, () => {
        describe(`when the community exists`, () => {
          it(`should create the client with the given community`, async () => {
            await assertCommandScenarioSuccess({
              httpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                communityId,
                firstName: clientFirstName,
                lastName: clientLastName,
              }),
              assertSuccess: async (acks) => {
                const newClient = (
                  await httpClient.get(`${clientIndexEndpoint}/${acks[0].id}`)
                ).data as ClientViewModelClientDto;

                // shouldn't this be .communityId ?
                expect(newClient.community?.id).toBe(communityId);

                expect(newClient.fullName.firstName).toBe(clientFirstName);

                expect(newClient.fullName.lastName).toBe(clientLastName);
              },
            });
          });
        });

        describe(`when the community does not exist`, () => {
          const bogusCommunityId = 'WD-40';

          it(`should return the expected error`, async () => {
            await assertCommandError({
              httpClient,
              endpoint: commandsEndpointForClients,
              commandFsa: TestCommandStream.buildOne(CreateClient, {
                communityId: bogusCommunityId,
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  bogusCommunityId,
                  'no such community',
                );
              },
            });
          });
        });
      });
    });

    describe(`when the client is marked as non-indigenous`, () => {
      describe(`when no community is provided`, () => {
        it(`should create the client`, async () => {
          await assertCommandSuccess({
            httpClient,
            endpoint: commandsEndpointForClients,
            commandFsa: TestCommandStream.buildOne(CreateClient, {
              communityId: undefined,
              firstName: clientFirstName,
              lastName: clientLastName,
              isIndigenous: 'No',
            }),
            assertSuccess: async (ack) => {
              const newClient = (
                await httpClient.get(`${clientIndexEndpoint}/${ack.id}`)
              ).data as ClientViewModelClientDto;

              expect(newClient.community?.id).toBe(undefined);

              expect(newClient.isIndigenous).toBe('No');

              expect(newClient.fullName.firstName).toBe(clientFirstName);

              expect(newClient.fullName.lastName).toBe(clientLastName);
            },
          });
        });
      });

      describe(`when a community is provided`, () => {
        it(`should return the expected error`, async () => {
          await assertCommandError({
            httpClient,
            endpoint: commandsEndpointForClients,
            commandFsa: TestCommandStream.buildOne(CreateClient, {
              isIndigenous: 'No',
              communityId,
            }),
            assertErrorMessageAsExpected: (error) => {
              assertTextMatchesAll(
                error,
                'non-indigenous',
                'cannot',
                'community',
                communityId,
              );
            },
          });
        });
      });
    });

    describe(`when the client's indigenous identity is unknown`, () => {
      describe(`when no community is provided`, () => {
        it(`should create the client`, async () => {
          await assertCommandSuccess({
            httpClient,
            endpoint: commandsEndpointForClients,
            commandFsa: TestCommandStream.buildOne(CreateClient, {
              firstName: clientFirstName,
              lastName: clientLastName,
              communityId: undefined,
              isIndigenous: 'Unknown',
            }),
            assertSuccess: async (ack) => {
              const newClient = (
                await httpClient.get(`${clientIndexEndpoint}/${ack.id}`)
              ).data as ClientViewModelClientDto;

              expect(newClient.fullName.firstName).toBe(clientFirstName);

              expect(newClient.fullName.lastName).toBe(clientLastName);

              expect(newClient.community?.id).toBe(undefined);
            },
          });
        });
      });

      describe(`when a community is provided`, () => {
        it(`should return the expected error`, async () => {
          await assertCommandError({
            httpClient,
            endpoint: commandsEndpointForClients,
            commandFsa: TestCommandStream.buildOne(CreateClient, {
              isIndigenous: 'Unknown',
              communityId,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                `When specifying a client's community`,
                `the client must be listed as Indigenous`,
                communityId,
              );
            },
          });
        });
      });
    });

    describe(`when an invalid community is specified for the client`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandError({
          httpClient,
          endpoint: commandsEndpointForClients,
          commandFsa: TestCommandStream.buildOne(CreateClient, {
            isIndigenous: 'Yes',
            communityId: missingCommunityId,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              missingCommunityId,
              'no such community',
            );
          },
        });
      });
    });
  });

  describe(`when adding community afiliation for a client`, () => {
    describe(`when the provided community exists`, () => {
      const secondCommunityName = 'Medium Sized Creek';

      describe(`when the client already has a community affiliation`, () => {
        it(`should return the expected error resposne`, async () => {
          await assertCommandSuccess({
            httpClient,
            endpoint: commandsEndpointForCommunities,
            commandFsa: TestCommandStream.buildOne(CreateCommunity, {
              name: secondCommunityName,
            }),
          });

          const communities = (await httpClient.get(communityIndexEndpoint))
            .data as CommunityViewModelClientDto[];

          const { id: secondCommunityId } = communities.find(
            (c) => c.name.items['en'].original?.text === secondCommunityName,
          ) as CommunityViewModelClientDto;

          await assertCommandScenarioError({
            httpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              isIndigenous: 'Yes',
              communityId,
            }).andThen(AddCommunityAffiliationForClient, {
              communityId: secondCommunityId,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                communityId,
                secondCommunityId,
                'already',
              );
            },
          });
        });
      });

      describe(`when the client is non-indigenous`, () => {
        it(`should return the expected error response`, async () => {
          await assertCommandScenarioError({
            httpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              communityId: undefined,
              isIndigenous: 'No',
            }).andThen(AddCommunityAffiliationForClient, {
              communityId,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                'cannot add a community',
                'non-indigenous client',
              );
            },
          });
        });
      });

      describe(`when whether the client is indigenous was previously recorded as unknown`, () => {
        it(`should update the client's community and mark them as indigenous`, async () => {
          await assertCommandScenarioSuccess({
            httpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: clientFirstName,
              lastName: clientLastName,
              isIndigenous: 'Unknown',
              communityId: undefined,
            }).andThen(AddCommunityAffiliationForClient, {
              communityId,
            }),
            assertSuccess: async (acks) => {
              const updated = (
                await httpClient.get(`${clientIndexEndpoint}/${acks[0].id}`)
              ).data as ClientViewModelClientDto;

              expect(updated.community?.id).toBe(communityId);

              expect(updated.isIndigenous).toBe('Yes');
            },
          });
        });
      });

      describe(`when the client was previously marked as indigenous, but their community was not specified`, () => {
        it(`should update the client's community`, async () => {
          await assertCommandScenarioSuccess({
            httpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: clientFirstName,
              lastName: clientLastName,
              isIndigenous: 'Yes',
              communityId: undefined,
            }).andThen(AddCommunityAffiliationForClient, {
              communityId,
            }),
            assertSuccess: async (acks) => {
              const updated = (
                await httpClient.get(`${clientIndexEndpoint}/${acks[0].id}`)
              ).data as ClientViewModelClientDto;

              expect(updated.isIndigenous).toBe('Yes');

              expect(updated.community?.id).toBe(communityId);
            },
          });
        });
      });
    });

    describe(`when the provided community does not exist`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandScenarioError({
          httpClient,
          endpoint: commandsEndpointForClients,
          stream: TestCommandStream.first(CreateClient, {
            firstName: clientFirstName,
            lastName: clientLastName,
            isIndigenous: 'Yes',
            communityId: undefined,
          }).andThen(AddCommunityAffiliationForClient, {
            communityId: missingCommunityId,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              missingCommunityId,
              'no such community',
            );
          },
        });
      });
    });
  });

  describe(`when flagging a client`, () => {
    describe(`when the client exists`, () => {
      describe(`when the target flag exists`, () => {
        describe(`when the client has no flags to start with`, () => {
          it(`should add a first flag`, async () => {
            await assertCommandScenarioSuccess({
              httpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                communityId: communityId,
              }).andThen(FlagClient, {
                flagId,
              }),
              assertSuccess: async (acks) => {
                const updated = (
                  await httpClient.get(`${clientIndexEndpoint}/${acks[0].id}`)
                ).data as ClientViewModelClientDto;

                expect(Object.keys(updated.flagsById)).toContain(flagId);

                const flagSearch = updated.flagsById[flagId];

                expect(flagSearch.label).toEqual(flagLabel);
              },
            });
          });
        });

        describe(`when the client already has some flags`, () => {
          describe(`when the new flag is distinct from existing flags`, () => {
            it(`should add the additional flag`, async () => {
              await assertCommandScenarioSuccess({
                httpClient,
                endpoint: commandsEndpointForClients,
                stream: TestCommandStream.first(CreateClient, {
                  communityId: communityId,
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
                httpClient,
                endpoint: commandsEndpointForClients,
                stream: TestCommandStream.first(CreateClient, {
                  communityId: communityId,
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
            httpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              communityId,
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
          httpClient,
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
