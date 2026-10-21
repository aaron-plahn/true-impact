import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import {
  CreateUserWithPassword,
  DeactivateUser,
} from '../../../features/users/commands';
import { TestCommandStream } from '../../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';
import { assertCommandScenarioSuccess } from '../utils';
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

const port = '3234';

const baseUrl = `http://localhost:${port}`;

const authBaseEndpoint = `${baseUrl}/auth`;

const sessionEndpoint = `${baseUrl}/users/who-am-i`;

const userCommandsEndpoint = `${baseUrl}/users/commands`;

const userSetupEndpoint = `${baseUrl}/users/test-setup`;

const logInEndpoint = `${authBaseEndpoint}/signin`;

const logOutEndpoint = `${authBaseEndpoint}/signout`;

const testUsername = 'hotmale99';

const testPassword = 'my$PACEwasSICKin99';

const bogusPassword = 'sorryMARIOcheckANOTHERcastle123';

const buildSigninDto = ({
  username,
  password,
}: {
  username: string;
  password: string;
}) => ({
  username,
  password,
});

const httpClientForTestRuns = new TestHttpClient('http://localhost:4200');

describe(`When loging in with a username and password (without Multi-factor Authentication enabled)`, () => {
  beforeAll(async () => {
    const _response = await signInAsAdmin(httpClientForTestRuns);
  });

  beforeEach(async () => {
    await httpClientForTestRuns.patch(userSetupEndpoint).catch((e) => {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to clear USERS for test setup. \n ${(e as Error)?.message || 'unknown error'}`,
        ),
      ]);
    });
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
          .post(
            logInEndpoint,
            buildSigninDto({
              username: testUsername,
              password: testPassword,
            }),
          )
          .catch((e) => {
            throw Error(`Test failed to post to login. ${e}`);
          });

        const setCookieHeaders = response.headers['set-cookie'];

        expect(setCookieHeaders).toBeTruthy();

        expect(response.status).toBe(HttpStatus.CREATED);

        const result = (await client.get(sessionEndpoint)).data as {
          username: string;
        };

        expect(result.username).toBe(testUsername);

        const logoutResult = await client.post(logOutEndpoint);

        // This should really be `201 [CREATED]` because the user is creating a session. Supertokens doesn't adhere to HTTP standards, but we should wrap it to do so.
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
        const dto = buildSigninDto({
          username: testUsername,
          password: bogusPassword,
        });

        const response = await axios
          .post(logInEndpoint, dto, {
            headers: {
              rid: 'emailpassword',
              'st-auth-mode': 'header',
            },
          })
          .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
            return {
              status: e.status,
              data: e.response.data,
            };
          });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe(`when the request is invalidly formatted`, () => {
    describe(`when the username is provided at an invalid key`, () => {
      it(`should return the expected error`, async () => {
        const response = await axios
          .post(logInEndpoint, {
            uname: testUsername,
            password: testPassword,
          })
          .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
            return {
              status: e.status,
              data: e.response.data,
            };
          });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

        expect(JSON.stringify(response.data)).toContain('Unauthorized');
      });
    });

    describe(`when the username is omitted`, () => {
      it(`should return the expected error`, async () => {
        const response = await axios
          .post(logInEndpoint, {
            // username: testUsername,
            password: testPassword,
          })
          .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
            return {
              status: e.status,
              data: e.response.data,
            };
          });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

        expect(JSON.stringify(response.data)).toContain('Unauthorized');
      });
    });

    describe(`when the password is omitted`, () => {
      it(`should return the expected error`, async () => {
        const response = await axios
          .post(logInEndpoint, {
            username: testUsername,
            // password: testPassword,
          })
          .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
            return {
              status: e.status,
              data: e.response.data,
            };
          });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

        expect(JSON.stringify(response.data)).toContain('Unauthorized');
      });
    });

    describe(`when an empty DTO is provided`, () => {
      it(`should return the expected error`, async () => {
        const response = await axios
          .post(logInEndpoint, {
            // username: testUsername,
            // password: testPassword,
          })
          .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
            return {
              status: e.status,
              data: e.response.data,
            };
          });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

        expect(JSON.stringify(response.data)).toContain('Unauthorized');
      });
    });

    describe(`when no request body is provided`, () => {
      it(`should return the expected error`, async () => {
        const response = await axios
          .post(logInEndpoint)
          .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
            return {
              status: e.status,
              data: e.response.data,
            };
          });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

        expect(JSON.stringify(response.data)).toContain('Unauthorized');
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
        .post(
          logInEndpoint,
          buildSigninDto({
            username: missingUsername,
            password: testPassword,
          }),
        )
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
        .post(
          logInEndpoint,
          buildSigninDto({
            username: testUsername,
            password: testPassword,
          }),
        )
        .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
          return {
            status: e.status,
          };
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
