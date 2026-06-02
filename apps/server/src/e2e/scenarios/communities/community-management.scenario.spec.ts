import axios from 'axios';
import {
  CreateCommunity,
  TranslateCommunityName,
} from '../../../features/communities/commands';
import { CommunityViewModelClientDto } from '../../../features/communities/queries';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { HttpStatus } from '../../../libs/framework';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import {
  assertCommandError,
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
} from '../utils';

// TODO From env.e2e
const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const communityBaseEndpoint = `${baseEndpoint}/communities`;

const commandsEndpointForCommunities = `${communityBaseEndpoint}/commands`;

const communityTestSetupEndpoint = `${communityBaseEndpoint}/test-setup`;

const englishCommunityName = 'The Community';

const translationOfTheCommunityName = 'Community Name in the language';

const originalLanguageCodeForName = 'en';

const translationLanguageCodeForName = 'clc';

const bandNumber = '711';

const nation = 'River People';

const createCommunity = TestCommandStream.first(CreateCommunity, {
  name: englishCommunityName,
  languageCodeForName: originalLanguageCodeForName,
  bandNumber,
  nation,
});

const translateCommunityName = createCommunity.andThen(TranslateCommunityName, {
  translation: translationOfTheCommunityName,
  languageCode: translationLanguageCodeForName,
});

describe(`Community Management Scenarios`, () => {
  beforeEach(async () => {
    await axios.patch(communityTestSetupEndpoint);
  });

  describe(`when creating a community`, () => {
    describe(`when the community name is valid`, () => {
      describe(`when the community name is in English (en)`, () => {
        it(`should create the community`, async () => {
          await assertCommandScenarioSuccess({
            endpoint: commandsEndpointForCommunities,
            stream: createCommunity,
            assertSuccess: async (acks) => {
              const searchResult = await axios.get(
                `${communityBaseEndpoint}/${acks[0].id}`,
              );

              expect(searchResult.status).toBe(HttpStatus.OK);

              const newCommunity =
                searchResult.data as CommunityViewModelClientDto;

              expect(
                newCommunity.name.items[originalLanguageCodeForName].original
                  ?.text,
              ).toBe(englishCommunityName);

              const { bandNumber, revision, nation } = newCommunity;

              expect(bandNumber).toBe(bandNumber);

              expect(revision).toBe('1');

              expect(nation).toBe(nation);
            },
          });
        });
      });
    });

    describe(`when the language of the community name is not currently supported (but will be in the near future)`, () => {
      describe(`clc`, () => {
        const unsupportedLanguageCode = 'clc';

        it(`should return the expected error resposne`, async () => {
          await assertCommandError({
            endpoint: commandsEndpointForCommunities,
            commandFsa: TestCommandStream.buildOne(CreateCommunity, {
              languageCodeForName: unsupportedLanguageCode,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                'not yet supported',
                unsupportedLanguageCode,
              );
            },
          });
        });
      });
    });

    describe(`when the language of the community name is not a known language`, () => {
      const invalidLanguageCode = 'X89';

      it(`should return the expected error resposne`, async () => {
        await assertCommandError({
          endpoint: commandsEndpointForCommunities,
          commandFsa: TestCommandStream.buildOne(CreateCommunity, {
            languageCodeForName: invalidLanguageCode,
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              invalidLanguageCode,
              'cannot create a community',
              'unknown language',
            );
          },
        });
      });
    });

    describe(`when there is already a community with the given name`, () => {
      it(`should return the expected error response`, async () => {
        await assertCommandScenarioSuccess({
          endpoint: commandsEndpointForCommunities,
          stream: createCommunity,
        });

        await assertCommandScenarioError({
          endpoint: commandsEndpointForCommunities,
          stream: TestCommandStream.first(CreateCommunity, {
            name: englishCommunityName,
            languageCodeForName: originalLanguageCodeForName,
            bandNumber: '101b',
          }),
          assertErrorMessageAsExpected: (message) => {
            assertTextMatchesAll(
              message,
              'cannot create community',
              englishCommunityName,
              bandNumber, // of the existing community
              'already',
            );
          },
        });
      });
    });
  });

  describe(`when translating a community's name`, () => {
    describe(`when the name has no translation`, () => {
      describe(`when the langauge code is a known langauge code`, () => {
        describe(`clc`, () => {
          it(`should translate the community name`, async () => {
            await assertCommandScenarioSuccess({
              endpoint: commandsEndpointForCommunities,
              stream: translateCommunityName,
              assertSuccess: async (acks) => {
                const { name } = (
                  await axios.get(`${communityBaseEndpoint}/${acks[0].id}`)
                ).data as CommunityViewModelClientDto;

                expect(
                  name.items[translationLanguageCodeForName]?.[
                    'free translation'
                  ]?.text,
                ).toBe(translationOfTheCommunityName);
              },
            });
          });
        });
      });

      describe(`when the language code is one that is not yet supported (but will be in the near future)`, () => {
        describe(`en`, () => {
          const invalidLanguageCode = 'en';

          it(`should translate the community name`, async () => {
            await assertCommandScenarioError({
              endpoint: commandsEndpointForCommunities,
              stream: createCommunity.andThen(TranslateCommunityName, {
                languageCode: invalidLanguageCode,
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  invalidLanguageCode,
                  'not yet supported',
                );
              },
            });
          });
        });
      });

      describe(`when the language code is not a valid language code`, () => {
        describe(`abc`, () => {
          const invalidLanguageCode = 'abc';

          it(`should return the expected error resposne`, async () => {
            await assertCommandScenarioError({
              endpoint: commandsEndpointForCommunities,
              stream: createCommunity.andThen(TranslateCommunityName, {
                languageCode: invalidLanguageCode,
              }),
              assertErrorMessageAsExpected: (message) => {
                assertTextMatchesAll(
                  message,
                  invalidLanguageCode,
                  'unknown language',
                );
              },
            });
          });
        });
      });
    });

    describe(`when the name has a translation`, () => {
      describe(`when the new translation targets the same langauge as the existing translation`, () => {
        it(`should return the expected error response`, async () => {
          await assertCommandScenarioError({
            endpoint: commandsEndpointForCommunities,
            stream: createCommunity.andThen(TranslateCommunityName, {
              languageCode: originalLanguageCodeForName,
            }),
            assertErrorMessageAsExpected: (message) => {
              assertTextMatchesAll(
                message,
                // this is what we expect until we support English translations
                'not yet supported',
                // in the future:
                // englishCommunityName,
                // originalLanguageCodeForName,
                // 'already has',
              );
            },
          });
        });
      });
    });
  });
});
