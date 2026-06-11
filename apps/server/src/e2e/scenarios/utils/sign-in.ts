import { HttpStatus } from '../../../libs/framework';
import { TestHttpClient } from './test-http-client';

const port = '3234';

const baseUrl = `http://localhost:${port}`;

const authBaseEndpoint = `${baseUrl}/auth`;

const logInEndpoint = `${authBaseEndpoint}/logIn`;

export const signIn = async (
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

export const signInAsAdmin = (httpClient: TestHttpClient) => {
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
