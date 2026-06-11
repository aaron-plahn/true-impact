import {
  PersistenceAcknowledgement,
  TestCommandStream,
} from '../../../libs/cqrs-es';
import { RestCommandStreamExecutor } from './rest-command-executor';
import { TestHttpClient } from './test-http-client';

export * from './assert-command-scenario-success';

export const assertCommandScenarioSuccess = async ({
  endpoint,
  stream,
  // name,
  assertSuccess: assertSuccessResponse,
  httpClient,
}: {
  endpoint: string;
  stream: TestCommandStream;
  // name: string;
  assertSuccess?: (acks: PersistenceAcknowledgement[]) => void | Promise<void>;
  httpClient?: TestHttpClient;
}) => {
  const results: PersistenceAcknowledgement[] = [];

  const fsasAndResults = await stream.execute(
    new RestCommandStreamExecutor(endpoint, httpClient),
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
