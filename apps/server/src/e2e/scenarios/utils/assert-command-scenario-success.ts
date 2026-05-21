import { isDeepStrictEqual } from 'node:util';
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

  if (!isDeepStrictEqual(headers, {})) {
    console.log('daaaaaaaaaaaaaaaaaaang');
  }

  const fsasAndResults = await stream.execute(
    new RestCommandStreamExecutor(endpoint),
    headers,
  );

  fsasAndResults.forEach(([_fsa, result]) => {
    if (!(result as PersistenceAcknowledgement).id) {
      console.log('oops');
    }

    const id = (result as PersistenceAcknowledgement).id;

    if (!id) {
      console.log("It's gonna fawking fail!");
    }

    expect((result as PersistenceAcknowledgement).id).toBeTruthy();

    results.push(result as PersistenceAcknowledgement);
  });

  if (typeof assertSuccessResponse == 'function') {
    await assertSuccessResponse(results);
  }
};
