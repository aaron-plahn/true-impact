import { HttpStatusCode } from 'axios';
import { CreateClient } from '../../../features/clients/commands';
import { ClientViewModelClientDto } from '../../../features/clients/queries';
import { CreateUserWithPassword } from '../../../features/users/commands';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { QueryOptions } from '../../../libs/framework';
import {
  AndQueryFilterCondition,
  ConditionalBlockType,
  LogicalOperator,
} from '../../../libs/query-language';
import { IndexTable } from '../../../libs/server-driven-ui';
import { assertCommandScenarioSuccess } from '../utils';
import { signIn, signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const clientIndexEndpoint = `${baseEndpoint}/clients`;

const commandsEndpointForClients = `${clientIndexEndpoint}/commands`;

const clientTestSetupEndpoint = `${clientIndexEndpoint}/test-setup`;

const userTestSetupEndpoint = `${baseEndpoint}/users/test-setup`;

const userCommandsEndpoint = `${baseEndpoint}/users/commands`;

/**
 * We can test filtering as follows:
 * Provide a user-defined `QueryFilter` object.
 * Assert the entities on the response either:
 * a. has the correct length
 * b. has the all the correct items by ID (or other unique field)
 */
const asssertQueryResponseHasExpectedEntities = async (
  client: TestHttpClient,
  queryOptions: QueryOptions,
  expectedIds: Set<string>,
) => {
  const rawResponse = await client.post(clientIndexEndpoint, queryOptions);

  expect(rawResponse.status).toBe(HttpStatusCode.Created);

  const response = rawResponse.data as IndexTable<ClientViewModelClientDto>;

  expect(response.rows).toHaveLength(expectedIds.size);

  const unexpectedRows = response.rows.filter(
    (row) => !expectedIds.has(row.id),
  );

  expect(unexpectedRows).toEqual([]);
};

/**
 * Test cases:
 * A. No filters or pagination
 *
 * B. Pagination without filters
 *
 *
 * C. Pagination with filters
 * i. one field
 * ii. multiple fields
 * iii. all fields
 *
 * D. invalid search fields provided
 * E. invalid paramters
 * F. not authorized (public user, non-admin user)
 *
 * Include:
 * - examples where there are 0 matches
 * - examples where there is 1 match
 * - examples where there are >1 and <count matches
 * - examples where all data matches
 *
 * **Note**
 * In the long run, we want to exhaustively test our query language \ filtering library
 * for a generic `Widget` model and then only test that we have wired up this functionality property
 * in the present test. This will save on redundant test cases across different index (list) views.
 *
 * We test filtering exhaustively here so we can focus on only UX concerns in our UX e2e (wdio) tests.
 */
describe(`Client index endpoint (POST /clients)`, () => {
  const adminHttpClient = new TestHttpClient('http://localhost:4200');

  beforeAll(async () => {
    // TODO test that an ordinary user with role `employee` can see the clients
    await signInAsAdmin(adminHttpClient);
  });

  beforeEach(async () => {
    await adminHttpClient.patch(clientTestSetupEndpoint);
  });

  const isIndigenousYesFilter: QueryOptions['filter'] = {
    type: ConditionalBlockType.AND,
    conditions: [
      {
        type: ConditionalBlockType.SIMPLE,
        field: 'isIndigenous',
        operator: LogicalOperator.EQUALS,
        params: ['Yes'],
      },
    ],
  } as const;

  const firstNameTextToMatch = 'Jo';

  const firstNameIncludesJoFilter: QueryOptions['filter'] = {
    type: ConditionalBlockType.AND,
    conditions: [
      {
        type: ConditionalBlockType.SIMPLE,
        field: 'firstName',
        operator: LogicalOperator.TEXT_INCLUDES,
        params: [firstNameTextToMatch],
      },
    ],
  };

  const paginationOptionsForFirstPageOfTen: QueryOptions['pagination'] = {
    page: 1,
    pageSize: 10,
  };

  describe(`when the user has permission to execute the query`, () => {
    describe(`when no filters or pagination have been provided`, () => {
      describe(`when there is no data in the database`, () => {
        it(`should return the expected empty response`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {},
            new Set(),
          );

          // TODO check or snapshot the entire response to ensure the contract is maintained with the client
        });
      });

      describe(`when there is only one client in the database`, () => {
        const expectedClientIds = new Set<string>();

        beforeEach(async () => {
          await assertCommandScenarioSuccess({
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {}),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
            httpClient: adminHttpClient,
          });
        });

        it(`should return the expected result`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {},
            expectedClientIds,
          );
        });
      });

      describe(`when there are several clients`, () => {
        const expectedClientIds = new Set<string>();

        beforeEach(async () => {
          // client 1
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Clienta',
              middleNames: [],
              lastName: 'McClienta',
            }),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
          });

          // client 2
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Clientwithonemiddlename',
              middleNames: ['onlymid'],
              lastName: 'McClientb',
            }),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
          });

          // client 3
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Clientwithmanymiddlenames',
              middleNames: ['midone', 'midtwo', 'midthree'],
              lastName: 'McClientc',
            }),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
          });
        });

        it(`should return the expected response`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {},
            expectedClientIds,
          );

          // TODO would this be a good response to snapshot as a contract test?
        });
      });
    });

    describe(`when pagination is provided without any filters`, () => {
      /**
       * TODO validate pagination defaults are set (e.g., if there are 500 results, we don't actually get 500 responses)
       * We may want a helper to directly write the views we want to the query DB once we have implemented this.
       */

      describe(`when there are no clients in the database`, () => {
        it(`should return the expected empty response`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {
              pagination: {
                page: 1,
                pageSize: 10,
              },
            },
            // no results expected as the DB is empty
            new Set(),
          );
        });
      });

      describe(`when there is less than a full page of clients`, () => {
        const expectedClientIds = new Set<string>();

        beforeEach(async () => {
          // client 1
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Clienta',
              middleNames: [],
              lastName: 'McClienta',
            }),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
          });

          // client 2
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Clientwithonemiddlename',
              middleNames: ['onlymid'],
              lastName: 'McClientb',
            }),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
          });

          // client 3
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Clientwithmanymiddlenames',
              middleNames: ['midone', 'midtwo', 'midthree'],
              lastName: 'McClientc',
            }),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
          });
        });

        it(`should return the expected response`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {
              pagination: {
                page: 1,
                pageSize: 5,
              },
            },
            expectedClientIds,
          );
        });
      });

      describe(`when there is exactly a full page of clients`, () => {
        const expectedClientIds = new Set<string>();

        const pageSize = 5;

        const clientNames = Array(pageSize)
          .fill(null)
          .map((_, index) => [`Clientfirst${index}`, `Clientlast${index}`]);

        beforeEach(async () => {
          for (const [firstName, lastName] of clientNames) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                firstName,
                lastName,
              }),
              onSuccess: (acks) => {
                expectedClientIds.add(acks[0].id);
              },
            });
          }
        });

        it(`should return the expected response`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {
              pagination: {
                page: 1,
                pageSize,
              },
            },
            expectedClientIds,
          );
        });
      });

      describe(`when there is more than one page of clients`, () => {
        let page1ClientIds: Set<string>;
        let page2ClientIds: Set<string>;
        let page3ClientIds: Set<string>;

        const pageSize = 5;

        const clientsOnFirstPage = Array(pageSize)
          .fill(null)
          .map((_, index) => `P1client${index}`);

        const clientsOnSecondPage = Array(pageSize)
          .fill(null)
          .map((_, index) => `P2client${index}`);

        const clientsOnThirdPage = Array(pageSize - 2)
          .fill(null)
          .map((_, index) => `P3client${index}`);

        beforeEach(async () => {
          page1ClientIds = new Set<string>();
          page2ClientIds = new Set<string>();
          page3ClientIds = new Set<string>();

          for (const firstName of clientsOnFirstPage) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, { firstName }),
              onSuccess: (acks) => {
                page1ClientIds.add(acks[0].id);
              },
            });
          }

          for (const firstName of clientsOnSecondPage) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, { firstName }),
              onSuccess: (acks) => {
                page2ClientIds.add(acks[0].id);
              },
            });
          }

          for (const firstName of clientsOnThirdPage) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, { firstName }),
              onSuccess: (acks) => {
                page3ClientIds.add(acks[0].id);
              },
            });
          }
        });

        describe(`when the second page is requested`, () => {
          const targetPage = 2;

          it(`should return the expected response`, async () => {
            await asssertQueryResponseHasExpectedEntities(
              adminHttpClient,
              {
                pagination: {
                  pageSize,
                  page: targetPage,
                },
              },
              page2ClientIds,
            );
          });
        });

        describe(`when the last page is requested`, () => {
          const targetPage = 3;

          it(`should return the expected response`, async () => {
            await asssertQueryResponseHasExpectedEntities(
              adminHttpClient,
              {
                pagination: {
                  pageSize,
                  page: targetPage,
                },
              },
              page3ClientIds,
            );
          });
        });
      });
    });

    // we comprehensively test filtering here
    describe(`when filters are provided without any pagination`, () => {
      describe(`when an AND filter with one condition is provided`, () => {
        const expectedClientIds = new Set<string>();

        describe(`when it matches some of the clients`, () => {
          beforeEach(async () => {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              // Can one stream encompass multiple aggregate roots?
              stream: TestCommandStream.first(CreateClient, {
                firstName: 'Matchingclient1',
                lastName: 'McTestclient',
                isIndigenous: 'Yes',
              }),
              onSuccess: (acks) => {
                expectedClientIds.add(acks[0].id);
              },
            });

            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                firstName: 'Nonmatchingclient1',
                lastName: 'McTestClient',
                isIndigenous: 'No',
              }),
            });
          });

          it(`should return the correct number of results`, async () => {
            await asssertQueryResponseHasExpectedEntities(
              adminHttpClient,
              {
                filter: isIndigenousYesFilter,
              },
              expectedClientIds,
            );
          });
        });
      });
    });

    describe(`when filters and pagination are provided`, () => {
      describe(`when there are no clients in the database`, () => {
        it(`should return the expected empty response`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {
              filter: isIndigenousYesFilter,
              pagination: paginationOptionsForFirstPageOfTen,
            },
            // i.e., empty result set is expected
            new Set(),
          );
        });
      });

      describe(`when there is less than a full page of clients`, () => {
        const expectedClientIds = new Set<string>();

        beforeEach(async () => {
          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Client1',
              isIndigenous: 'Yes',
            }),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
          });

          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Client2',
              isIndigenous: 'No',
            }),
          });

          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Client3',
              isIndigenous: 'Yes',
            }),
            onSuccess: (acks) => {
              expectedClientIds.add(acks[0].id);
            },
          });

          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Client4',
              isIndigenous: 'Unknown',
            }),
          });
        });

        it(`should return the expected response`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {
              filter: isIndigenousYesFilter,
              pagination: paginationOptionsForFirstPageOfTen,
            },
            expectedClientIds,
          );
        });
      });

      describe(`when there is exactly a full page of clients`, () => {
        const expectedClientIds = new Set<string>();

        const pageSize = 20;

        const firstNamesOfMatchingClients = Array(pageSize)
          .fill(null)
          .map((_, index) => `${firstNameTextToMatch}${index + 1}`);

        const firstNamesOfNonMatchingClients = Array(pageSize * 2 + 1)
          .fill(null)
          .map((_, index) => `Nomatch${index + 1}`);

        beforeEach(async () => {
          for (const firstName of firstNamesOfMatchingClients) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                firstName,
              }),
              onSuccess: (acks) => {
                expectedClientIds.add(acks[0].id);
              },
            });
          }

          for (const firstName of firstNamesOfNonMatchingClients) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, { firstName }),
            });
          }
        });

        it(`should return the expected response`, async () => {
          await asssertQueryResponseHasExpectedEntities(
            adminHttpClient,
            {
              pagination: {
                pageSize,
                page: 1,
              },
              filter: firstNameIncludesJoFilter,
            },
            expectedClientIds,
          );
        });
      });

      describe(`when there is more than one page of clients`, () => {
        const pageSize = 5;

        const nameContainsJoAndIsIndigenousFilter: AndQueryFilterCondition = {
          type: ConditionalBlockType.AND,
          conditions: [
            firstNameIncludesJoFilter.conditions[0],
            isIndigenousYesFilter.conditions[0],
          ],
        };

        let firstPageClientIds: Set<string>;

        let secondPageClientIds: Set<string>;

        let thirdPageClientIds: Set<string>;

        beforeEach(async () => {
          firstPageClientIds = new Set<string>();

          const page1Names = Array(pageSize)
            .fill(null)
            .map((_, index) => {
              return `Page1client${firstNameTextToMatch}${index + 1}`;
            });

          for (const firstName of page1Names) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                firstName,
                isIndigenous: 'Yes',
              }),
              onSuccess: (acks) => {
                firstPageClientIds.add(acks[0].id);
              },
            });
          }

          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: `${firstNameTextToMatch}butnotindigenous`,
              isIndigenous: 'No',
            }),
          });

          secondPageClientIds = new Set();

          const page2Names = Array(pageSize)
            .fill(null)
            .map((_, index) => {
              return `Page2client${firstNameTextToMatch}${index + 1}`;
            });

          for (const firstName of page2Names) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                firstName,
                isIndigenous: 'Yes',
              }),
              onSuccess: (acks) => {
                secondPageClientIds.add(acks[0].id);
              },
            });
          }

          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: `${firstNameTextToMatch}butindigeneityunknown`,
              isIndigenous: 'Unknown',
            }),
          });

          thirdPageClientIds = new Set();

          const page3Names = Array(pageSize - 2)
            .fill(null)
            .map((_, index) => {
              return `Page3client${firstNameTextToMatch}${index + 1}`;
            });

          for (const firstName of page3Names) {
            await assertCommandScenarioSuccess({
              httpClient: adminHttpClient,
              endpoint: commandsEndpointForClients,
              stream: TestCommandStream.first(CreateClient, {
                firstName,
                isIndigenous: 'Yes',
              }),
              onSuccess: (acks) => {
                thirdPageClientIds.add(acks[0].id);
              },
            });
          }

          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Mynamedoesntmatchbutiamindigenous',
              isIndigenous: 'Yes',
            }),
          });

          await assertCommandScenarioSuccess({
            httpClient: adminHttpClient,
            endpoint: commandsEndpointForClients,
            stream: TestCommandStream.first(CreateClient, {
              firstName: 'Nomatchatall',
              isIndigenous: 'No',
            }),
          });
        });

        describe(`when the first page is requested`, () => {
          it(`should return the expected result set`, async () => {
            await asssertQueryResponseHasExpectedEntities(
              adminHttpClient,
              {
                pagination: {
                  pageSize,
                  page: 1,
                },
                filter: nameContainsJoAndIsIndigenousFilter,
              },
              firstPageClientIds,
            );
          });
        });

        describe(`when the second page is requested`, () => {
          it(`should return the expected response`, async () => {
            await asssertQueryResponseHasExpectedEntities(
              adminHttpClient,
              {
                pagination: {
                  pageSize,
                  page: 2,
                },
                filter: nameContainsJoAndIsIndigenousFilter,
              },
              secondPageClientIds,
            );
          });
        });

        describe(`when the last page is requested`, () => {
          it(`should return the expected response`, async () => {
            await asssertQueryResponseHasExpectedEntities(
              adminHttpClient,
              {
                pagination: {
                  pageSize,
                  page: 3,
                },
                filter: nameContainsJoAndIsIndigenousFilter,
              },
              thirdPageClientIds,
            );
          });
        });
      });
    });
  });

  describe(`when the user does not have permission to execute the query`, () => {
    beforeEach(async () => {
      await adminHttpClient.patch(userTestSetupEndpoint);
    });

    describe(`when the user is not authenticated (public request)`, () => {
      it(`should return not authoirized`, async () => {
        const publicClient = new TestHttpClient('http://localhost:4200');

        const result = await publicClient
          .post(clientIndexEndpoint, {})
          .catch((e: { status: number }) => e);

        expect(result.status).toBe(HttpStatusCode.Forbidden);
      });
    });

    // TODO Allow ordinary employees to see the clients list. Do not include sensitive information in this view.

    describe(`when the user only has the non-admin role [employee]`, () => {
      const username = 'counsellor1';

      const password = 'impossibleTOGUESSpassword123';

      // TODO can't the client origin be pulled from the environment in the `TestHttpClient` constructor?
      const httpClientForEmployee = new TestHttpClient('http://localhost:4200');

      beforeAll(async () => {
        await assertCommandScenarioSuccess({
          endpoint: userCommandsEndpoint,
          stream: TestCommandStream.first(CreateUserWithPassword, {
            username,
            password,
          }),
          // TODO give the user an empty role by default instead of defaulting to `employee`?
          //   .andThen(GrantUserRole, {
          //     role: 'employee',
          //   }),
          httpClient: adminHttpClient,
        });

        await signIn(
          {
            username,
            password,
          },
          httpClientForEmployee,
        );
      });

      it(`should return unauthorized`, async () => {
        const result = await httpClientForEmployee
          .post(clientIndexEndpoint, {})
          .catch((e: { status: number }) => e);

        expect(result.status).toBe(HttpStatusCode.Forbidden);
      });
    });
  });
});
