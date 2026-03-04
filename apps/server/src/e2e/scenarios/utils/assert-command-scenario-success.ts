import {
  PersistenceAcknowledgement,
  TestCommandStream,
} from '../../../libs/cqrs-es';
import { RestCommandStreamExecutor } from './rest-command-executor';

export * from './assert-command-scenario-success';

export const assertScenarioSuccess = async ({
  endpoint,
  stream,
  // name,
  assertSuccess: assertSuccessResponse,
}: {
  endpoint: string;
  stream: TestCommandStream;
  // name: string;
  assertSuccess?: (acks: PersistenceAcknowledgement[]) => void | Promise<void>;
}) => {
  const results: PersistenceAcknowledgement[] = [];

  const fsasAndResults = await stream.execute(
    new RestCommandStreamExecutor(endpoint),
  );

  fsasAndResults.forEach(([_fsa, result]) => {
    if (!(result as PersistenceAcknowledgement).id) {
      console.log('oops');
    }

    expect((result as PersistenceAcknowledgement).id).toBeTruthy();

    results.push(result as PersistenceAcknowledgement);
  });

  if (typeof assertSuccessResponse == 'function') {
    await assertSuccessResponse(results);
  }
};
