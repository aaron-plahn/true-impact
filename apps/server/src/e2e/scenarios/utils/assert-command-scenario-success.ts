import {
  PersistenceAcknowledgement,
  TestCommandStream,
} from '../../../libs/cqrs-es';
import { RestCommandStreamExecutor } from './rest-command-executor';

export * from './assert-command-scenario-success';

export const assertCommandScenarioSuccess = async ({
  endpoint,
  stream,
  // name,
  assertSuccess: assertSuccessResponse,
  headers = {},
}: {
  endpoint: string;
  stream: TestCommandStream;
  // name: string;
  assertSuccess?: (acks: PersistenceAcknowledgement[]) => void | Promise<void>;
  // this is important for mocking authenticated requests
  headers?: Record<string, unknown>;
}) => {
  const results: PersistenceAcknowledgement[] = [];

  const fsasAndResults = await stream.execute(
    new RestCommandStreamExecutor(endpoint),
    headers,
  );

  fsasAndResults.forEach(([_fsa, result]) => {
    if (!(result as PersistenceAcknowledgement).id) {
      console.log({ unexpectedFailingTestCommand: result });
    }

    const id = (result as PersistenceAcknowledgement).id;

    if (!id) {
      throw new Error(
        `Command Scenario (command: ${_fsa.type} ) Test Failed: ${JSON.stringify(result)}`,
      );
    }

    expect(id).toBeTruthy();

    results.push(result as PersistenceAcknowledgement);
  });

  if (typeof assertSuccessResponse == 'function') {
    await assertSuccessResponse(results);
  }
};
