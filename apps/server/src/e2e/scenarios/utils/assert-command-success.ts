import { AxiosResponse } from 'axios';
import { ICommandFsa, PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { HttpStatus } from '../../../libs/framework';
import { CommandErrorResponseBody, SuccessResponse } from './command-responses';
import { TestHttpClient } from './test-http-client';

type SuccessTestCase = {
  endpoint: string;
  commandFsa: ICommandFsa;
  // arrange: () => Promise<void>;
  assertSuccess?: (response: SuccessResponse['body']) => Promise<void>;
  httpClient: TestHttpClient;
};

export const assertCommandSuccess = async ({
  endpoint,
  commandFsa,
  assertSuccess: assertSuccess,
  httpClient,
}: SuccessTestCase) => {
  const response = await httpClient
    .post(endpoint, commandFsa)
    .catch(
      (e: {
        status: HttpStatus;
        response: { data: CommandErrorResponseBody };
      }) => {
        return {
          status: e.status,
          body: {
            message: e.response.data.message,
          },
        };
      },
    );

  if ((response.status as HttpStatus) !== HttpStatus.CREATED) {
    console.log('test setup failed here');
  }

  expect(response.status).toBe(HttpStatus.CREATED);

  const successResponse = {
    status: response.status,

    body: (response as AxiosResponse).data as PersistenceAcknowledgement,
  } as unknown as SuccessResponse;

  if (typeof assertSuccess === 'function') {
    await assertSuccess(successResponse.body);
  }
};
