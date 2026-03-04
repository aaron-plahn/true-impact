import axios, { AxiosResponse } from 'axios';
import { HttpStatus } from '../../../libs/framework';
import { CommandErrorResponseBody } from './command-responses';

export const assertQueryResponse = async <TBody = Record<string, unknown>>({
  endpoint,
  assertResponseBody,
}: {
  endpoint: string;
  assertResponseBody?: (body: TBody) => void | Promise<void>;
}): Promise<void> => {
  const result = await axios
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
