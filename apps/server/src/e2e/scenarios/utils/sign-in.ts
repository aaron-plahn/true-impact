import { HttpStatus } from '../../../libs/framework';
import { TestHttpClient } from './test-http-client';

const port = '3234';

const baseUrl = `http://localhost:${port}`;

const authBaseEndpoint = `${baseUrl}/auth`;

const logInEndpoint = `${authBaseEndpoint}/signin`;

const logOutEndpoint = `${authBaseEndpoint}/signout`;

export const signOut = async (httpClient: TestHttpClient) => {
  await httpClient.post(logOutEndpoint, {
    headers: { rid: 'session' },
  });
};

export const signIn = async (
  { username, password }: { username: string; password: string },
  httpClient: TestHttpClient,
) => {
  const result = await httpClient
    .post(
      logInEndpoint,
      {
        formFields: [
          {
            // TODO can't this be username instead?
            id: 'email',
            value: username,
          },
          {
            id: 'password',
            value: password,
          },
        ],
      },
      {
        headers: {
          rid: 'emailpassword',
        },
      },
    )
    .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
      return {
        status: e.status,
      };
    });

  expect(result.status).toBe(HttpStatus.OK);

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
