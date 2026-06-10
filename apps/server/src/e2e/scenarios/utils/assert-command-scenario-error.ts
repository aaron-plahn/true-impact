import {
  ICommandFsa,
  PersistenceAcknowledgement,
  TestCommandStream,
} from '../../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';
import { TestHttpClient } from '../test-utils';
import { CommandErrorResponseBody } from './command-responses';
import { RestCommandStreamExecutor } from './rest-command-executor';

type ErrorTestCase = {
  endpoint: string;
  stream: TestCommandStream;
  assertErrorMessageAsExpected?: (message: string) => void;
  httpClient?: TestHttpClient;
};

export const assertCommandScenarioError = async ({
  endpoint,
  stream,
  assertErrorMessageAsExpected,
  httpClient,
}: ErrorTestCase): Promise<void> => {
  const results = await stream.execute(
    new RestCommandStreamExecutor(endpoint, httpClient),
  );

  const failingCommands: [ICommandFsa, CommandErrorResponseBody][] =
    results.filter(
      (
        next: [
          ICommandFsa,
          PersistenceAcknowledgement | CommandErrorResponseBody,
        ],
      ): next is [ICommandFsa, CommandErrorResponseBody] => {
        const [_fsa, result] = next;

        if (
          (result as unknown as { innerErrors: TrueImpactError[] }).innerErrors
        ) {
          throw new TrueImpactRuntimeException([
            new TrueImpactError(
              `Invalid format for an error response. Are you missing a response interceptor?\nIf not, are you missing an @UpdateMethod() decorator on the target update method for the given aggregate root?`,
            ),
          ]);
        }

        return typeof (result as CommandErrorResponseBody).message === 'string';
      },
    );

  if (failingCommands.length !== 1) {
    console.log('Test command scenario should have errored out, but did not.');
  }

  expect(failingCommands).toHaveLength(1);

  const resultForLastCommand = failingCommands.at(-1)?.[1];

  expect(
    (resultForLastCommand as CommandErrorResponseBody).message,
  ).toBeTruthy();

  if (
    typeof resultForLastCommand?.toString === 'function' &&
    typeof assertErrorMessageAsExpected === 'function'
  ) {
    assertErrorMessageAsExpected(resultForLastCommand.message);
  }
};
