import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { SessionInfoForAuthenticatedUser } from '../../../auth/auth.controller';
import { CreateUserWithPassword } from '../../../features/users/commands/create-user-with-password.command';
import { DeactivateUser } from '../../../features/users/commands/deactivate-user.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { TestHttpClient } from '../test-utils';
import { assertCommandScenarioSuccess } from '../utils';

const port = '3234';

const baseUrl = `http://localhost:${port}`;

const authBaseEndpoint = `${baseUrl}/auth`;

const sessionEndpoint = `${authBaseEndpoint}/session`;

const userCommandsEndpoint = `${baseUrl}/users/commands`;

const userSetupEndpoint = `${baseUrl}/users/test-setup`;

const logInEndpoint = `${authBaseEndpoint}/logIn`;

const logOutEndpoint = `${authBaseEndpoint}/logOut`;

const testUsername = 'hotmale99';

const testPassword = 'my$PACEwasSICKin99';

const bogusPassword = 'sorryMARIOcheckANOTHERcastle123';

const signIn = async (
  { username, password }: { username: string; password: string },
  httpClient: TestHttpClient,
) => {
  const result = await httpClient
    .post(logInEndpoint, {
      username,
      password,
    })
    .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
      return {
        status: e.status,
      };
    });

  expect(result.status).toBe(HttpStatus.CREATED);

  return result;
};

const signInAsAdmin = (httpClient: TestHttpClient) => {
  const username = process.env.SYSTEM_ADMIN_USERNAME;

  if (typeof username !== 'string') {
    throw new Error(
      `Test failed. You need to set $SYSTEM_ADMIN_USERNAME in your test environment.`,
    );
  }

  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (typeof password !== 'string') {
    throw new Error(
      `Test failed. You need to set $INITIAL_ADMIN_PASSWORD in your test enviornment.`,
    );
  }

  return signIn(
    {
      username,
      password,
    },
    httpClient,
  );
};

describe(`When loging in with a username and password (without Multi-factor Authentication enabled)`, () => {
  beforeEach(async () => {
    // TODO get rid of direct usage of axios in favor of TestHttpClient. It's confusing to have both.
    await axios.patch(userSetupEndpoint);
  });

  describe(`when the user exists`, () => {
    beforeEach(async () => {
      const httpClientForDataSeeding = new TestHttpClient(
        'http://localhost:4200',
      );

      await signInAsAdmin(httpClientForDataSeeding);

      await assertCommandScenarioSuccess({
        endpoint: userCommandsEndpoint,
        stream: TestCommandStream.first(CreateUserWithPassword, {
          username: testUsername,
          password: testPassword,
        }),
        httpClient: httpClientForDataSeeding,
      });
    });

    describe(`when the credentials are correct`, () => {
      const client = new TestHttpClient('http://localhost:4200');

      /**
       * We might verify this at the `e2e` level by providing an addtional
       * endpoint that the current user can use to view their profile.
       */
      it(`should succeed and set the user ID on the session`, async () => {
        const response = await client
          .post(logInEndpoint, {
            username: testUsername,
            password: testPassword,
          })
          .catch((e) => {
            throw Error(`Test failed to post to login. ${e}`);
          });

        const _foo = response.headers['set-cookie'];

        expect(response.status).toBe(HttpStatus.CREATED);

        const result = (await client.get(sessionEndpoint))
          .data as SessionInfoForAuthenticatedUser;

        expect(result.username).toBe(testUsername);

        const logoutResult = await client.post(logOutEndpoint);

        expect(logoutResult.status).toBe(HttpStatus.CREATED);

        const unauthenticatedSessionAccessResult = await client
          .get(sessionEndpoint)
          .catch((e: Error) => {
            return e;
          });

        expect(
          (unauthenticatedSessionAccessResult as { status: number }).status,
        ).toBe(HttpStatus.UNAUTHORIZED);
      });
    });

    describe(`when the credentials are not correct`, () => {
      it(`should return unauthorized`, async () => {
        const response = await axios
          .post(logInEndpoint, {
            username: testUsername,
            password: bogusPassword,
          })
          .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
            return {
              status: e.status,
            };
          });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe(`when the user does not exist`, () => {
    /**
     * Note that there should be no observable difference between
     * this and user not found. Ideally, we will make it difficult to use
     * timing (i.e., the extra time taken to compute hashes) to determine which
     * case was encountered.
     */
    it(`should return an unauthorized error`, async () => {
      const missingUsername = 'badactor55';

      const response = await axios
        .post(logInEndpoint, {
          username: missingUsername,
          password: testPassword,
        })
        .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
          return {
            status: e.status,
          };
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe(`when the user has been deactivated`, () => {
    beforeEach(async () => {
      const httpClientForDataSeeding = new TestHttpClient(
        'http://localhost:4200',
      );

      await signInAsAdmin(httpClientForDataSeeding);

      await assertCommandScenarioSuccess({
        endpoint: userCommandsEndpoint,
        stream: TestCommandStream.first(CreateUserWithPassword, {
          username: testUsername,
          password: testPassword,
        }).andThen(DeactivateUser),
        httpClient: httpClientForDataSeeding,
      });
    });

    it(`should return unauthorized`, async () => {
      const response = await axios
        .post(logInEndpoint, {
          username: testUsername,
          password: testPassword,
        })
        .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
          return {
            status: e.status,
          };
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
