import axios, { AxiosResponse } from 'axios';
import { ICommandFsa, PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { HttpStatus } from '../../../libs/framework';
import { CommandErrorResponseBody, SuccessResponse } from './command-responses';

type SuccessTestCase = {
  endpoint: string;
  commandFsa: ICommandFsa;
  // arrange: () => Promise<void>;
  assert?: (response: SuccessResponse) => Promise<void>;
};

export const assertCommandSuccess = async ({
  endpoint,
  commandFsa,
  assert: assertSuccess,
}: SuccessTestCase) => {
  const response = await axios
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

  expect(response.status).toBe(HttpStatus.CREATED);

  const successResponse = {
    status: response.status,

    body: (response as AxiosResponse).data as PersistenceAcknowledgement,
  } as unknown as SuccessResponse;

  if (typeof assertSuccess === 'function') {
    await assertSuccess(successResponse);
  }
};
