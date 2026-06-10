import { ICommandFsa } from '../../../libs/cqrs-es';
import { TestHttpClient } from '../test-utils';
import { CommandErrorResponseBody } from './command-responses';
import { RestCommandStreamExecutor } from './rest-command-executor';

export const assertCommandError = async ({
  endpoint,
  commandFsa,
  assertErrorMessageAsExpected,
  httpClient,
}: {
  endpoint: string;
  commandFsa: ICommandFsa;
  assertErrorMessageAsExpected?: (message: string) => void;
  httpClient?: TestHttpClient;
}) => {
  const result = await new RestCommandStreamExecutor(
    endpoint,
    httpClient,
  ).execute(commandFsa);

  const { message } = result as CommandErrorResponseBody;

  expect(message).toBeTruthy();

  if (typeof assertErrorMessageAsExpected === 'function') {
    assertErrorMessageAsExpected(message);
  }
};
