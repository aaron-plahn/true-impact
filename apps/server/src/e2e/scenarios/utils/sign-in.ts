import { HttpStatus } from '../../../libs/framework';
import { TestHttpClient } from './test-http-client';

const port = '3234';

const baseUrl = `http://localhost:${port}`;

const authBaseEndpoint = `${baseUrl}`;

const logInEndpoint = `${authBaseEndpoint}/auth/signin`;

const logOutEndpoint = `${authBaseEndpoint}/auth/signout`;

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
    .post<Record<string, unknown>>(
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
          'st-auth-mode': 'header',
        },
      },
    )
    .catch((e: { status: HttpStatus; response: { data: unknown } }) => {
      return {
        status: e.status,
        data: {},
      };
    });

  console.log({
    result,
    username,
    password,
  });

  expect(result.status).toBe(HttpStatus.OK);

  expect((result.data as { status?: string })?.status).not.toBe('FIELD_ERROR');

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
