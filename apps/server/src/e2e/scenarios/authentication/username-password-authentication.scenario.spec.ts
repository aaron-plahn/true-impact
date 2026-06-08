import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { SessionInfoForAuthenticatedUser } from '../../../auth/auth.controller';
import { CreateUserWithPassword } from '../../../features/users/commands/create-user-with-password.command';
import { DeactivateUser } from '../../../features/users/commands/deactivate-user.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
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

describe(`When loging in with a username and password (without Multi-factor Authentication enabled)`, () => {
  beforeEach(async () => {
    await axios.patch(userSetupEndpoint);
  });

  describe(`when the user exists`, () => {
    beforeEach(async () => {
      await assertCommandScenarioSuccess({
        endpoint: userCommandsEndpoint,
        stream: TestCommandStream.first(CreateUserWithPassword, {
          username: testUsername,
          password: testPassword,
        }),
      });
    });

    describe(`when the credentials are correct`, () => {
      let cookies: string[];

      const client = axios.create({
        withCredentials: true,
        headers: {
          Origin: 'http://localhost:4200',
        },
      });

      client.interceptors.request.use((config) => {
        console.log(`OUTGOING AXIOS REQUEST ----------`);

        console.log('URL:', config.url);

        console.log('HEADERS:', config.headers);

        return config;
      });

      client.interceptors.response.use((config) => {
        console.log('RESPONSE HEADERS ---->', config.headers);

        if ('set-cookie' in config.headers) {
          const foo = config.headers['set-cookie'];

          if (foo) {
            cookies = foo;
          }
        }

        return config;
      });

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

        const result = (
          await client.get(sessionEndpoint, {
            headers: {
              Cookie: cookies[0],
            },
          })
        ).data as SessionInfoForAuthenticatedUser;

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
      await assertCommandScenarioSuccess({
        endpoint: userCommandsEndpoint,
        stream: TestCommandStream.first(CreateUserWithPassword, {
          username: testUsername,
          password: testPassword,
        }).andThen(DeactivateUser),
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
