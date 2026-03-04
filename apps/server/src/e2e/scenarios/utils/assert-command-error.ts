import { ICommandFsa } from '../../../libs/cqrs-es';
import { CommandErrorResponseBody } from './command-responses';
import { RestCommandStreamExecutor } from './rest-command-executor';

export const assertCommandError = async ({
  endpoint,
  commandFsa,
  assertErrorMessageAsExpected,
}: {
  endpoint: string;
  commandFsa: ICommandFsa;
  assertErrorMessageAsExpected?: (message: string) => void;
}) => {
  const result = await new RestCommandStreamExecutor(endpoint).execute(
    commandFsa,
  );

  const { message } = result as CommandErrorResponseBody;

  expect(message).toBeTruthy();

  if (typeof assertErrorMessageAsExpected === 'function') {
    assertErrorMessageAsExpected(message);
  }
};
