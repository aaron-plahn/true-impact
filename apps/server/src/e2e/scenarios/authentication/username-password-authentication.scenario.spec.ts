import { HttpStatus } from '@nestjs/common';
import axios from 'axios';

const port = '3234';

const baseUrl = `http://localhost:${port}`;

const authBaseEndpoint = `${baseUrl}/auth`;

const logInEndpoint = `${authBaseEndpoint}/logIn`;

const testUsername = 'hotmale99';

const _testPassword = 'my$PACEwasSICKin99';

const bogusPassword = 'sorryMARIOcheckANOTHERcastle123';

describe(`When loging in with a username and password (without Multi-factor Authentication enabled)`, () => {
  describe(`when the user exists`, () => {
    describe(`when the credentials are correct`, () => {
      /**
       * We might verify this at the `e2e` level by providing an addtional
       * endpoint that the current user can use to view their profile.
       */
      it.todo(`should succeed and set the user ID on the session`);
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
    it.todo(`should return unauthorized`);
  });

  describe(`when the user has been deactivated`, () => {
    it.todo(`should return unauthorized`);
  });
});
