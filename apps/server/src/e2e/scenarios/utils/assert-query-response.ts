import { AxiosResponse } from 'axios';
import { HttpStatus } from '../../../libs/framework';
import { CommandErrorResponseBody } from './command-responses';
import { TestHttpClient } from './test-http-client';

export const assertQueryResponse = async <TBody = Record<string, unknown>>({
  httpClient,
  endpoint,
  assertResponseBody,
}: {
  httpClient: TestHttpClient;
  endpoint: string;
  assertResponseBody?: (body: TBody) => void | Promise<void>;
}): Promise<void> => {
  const result = await httpClient
    .get(endpoint)
    .catch(
      (e: {
        status: HttpStatus;
        response: { data: CommandErrorResponseBody };
      }) => {
        return {
          status: e.status,
          message: e.response.data.message,
        };
      },
    );

  expect(result.status).toBe(HttpStatus.OK);

  const body = (result as AxiosResponse).data as TBody;

  if (typeof assertResponseBody === 'function') {
    await assertResponseBody(body);
  }
};
