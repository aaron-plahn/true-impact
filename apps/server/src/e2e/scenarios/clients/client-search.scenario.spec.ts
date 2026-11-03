import { HttpStatusCode } from 'axios';
import { CreateClient } from '../../../features/clients/commands';
import { ClientViewModelClientDto } from '../../../features/clients/queries';
import { CreateUserWithPassword } from '../../../features/users/commands';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { QueryOptions } from '../../../libs/framework';
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
            assertSuccess: (acks) => {
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
        it.todo(`should return the expected response`);
      });
    });

    describe(`when pagination is provided without any filters`, () => {
      describe(`when there are no clients in the database`, () => {
        it(`should return the expected empty response`, () => {});
      });

      describe(`when there is less than a full page of clients`, () => {
        it.todo(`should return the expected response`);
      });

      describe(`when there is exactly a full page of clients`, () => {
        it.todo(`should return the expected response`);
      });

      describe(`when there is more than one page of clients`, () => {
        describe(`when the second page is requested`, () => {
          it.todo(`should return the expected response`);
        });

        describe(`when the next-to-last page is requested`, () => {
          it.todo(`should return the expected response`);
        });

        describe(`when the last page is requested`, () => {
          it.todo(`should return the expected response`);
        });
      });
    });

    // we comprehensively test filtering here
    describe(`when filters are provided without any pagination`, () => {
      describe(`when an AND filter with one condition is provided`, () => {
        describe(`when it matches some of the clients`, () => {
          it.todo(`should return the correct number of results`);
        });
      });
    });

    describe(`when filters and pagination are provided`, () => {
      describe(`when there are no clients in the database`, () => {
        it(`should return the expected empty response`, () => {});
      });

      describe(`when there is less than a full page of clients`, () => {
        it.todo(`should return the expected response`);
      });

      describe(`when there is exactly a full page of clients`, () => {
        it.todo(`should return the expected response`);
      });

      describe(`when there is more than one page of clients`, () => {
        describe(`when the second page is requested`, () => {
          it.todo(`should return the expected response`);
        });

        describe(`when the next-to-last page is requested`, () => {
          it.todo(`should return the expected response`);
        });

        describe(`when the last page is requested`, () => {
          it.todo(`should return the expected response`);
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
