import axios, { AxiosResponse } from 'axios';
import {
  CommandSuccessAcknowledgement,
  ICommandFsa,
  TestCommandStream,
} from '../../../libs/cqrs-es';
import { HttpStatus } from '../../../libs/framework';

type CommandErrorResponseBody = {
  status: number;
  message: string;
};

class RestCommandStreamExecutor {
  constructor(private readonly endpoint: string) {}

  async execute(fsa: ICommandFsa) {
    const response = await axios
      .post(this.endpoint, fsa)
      .catch(
        (e: {
          status: HttpStatus;
          response: { data: CommandErrorResponseBody };
        }) => {
          return {
            status: e.status,
            data: {
              message: e.response.data.message,
            },
          };
        },
      );

    const result = response.data as
      | CommandSuccessAcknowledgement
      | CommandErrorResponseBody;

    return result;
  }
}

type SuccessResponse = {
  status: HttpStatus;
  body: CommandSuccessAcknowledgement;
};

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

    body: (response as AxiosResponse).data as CommandSuccessAcknowledgement,
  } as unknown as SuccessResponse;

  if (typeof assertSuccess === 'function') {
    await assertSuccess(successResponse);
  }
};

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

export const assertScenarioSuccess = async ({
  endpoint,
  stream,
  // name,
  assertSuccess: assertSuccessResponse,
}: {
  endpoint: string;
  stream: TestCommandStream;
  // name: string;
  assertSuccess?: (
    acks: CommandSuccessAcknowledgement[],
  ) => void | Promise<void>;
}) => {
  const results: CommandSuccessAcknowledgement[] = [];

  const fsasAndResults = await stream.execute(
    new RestCommandStreamExecutor(endpoint),
  );

  fsasAndResults.forEach(([_fsa, result]) => {
    expect((result as CommandSuccessAcknowledgement).id).toBeTruthy();

    results.push(result as CommandSuccessAcknowledgement);
  });

  if (typeof assertSuccessResponse == 'function') {
    await assertSuccessResponse(results);
  }
};

type ErrorTestCase = {
  endpoint: string;
  stream: TestCommandStream;
  assertErrorMessageAsExpected?: (message: string) => void;
};

export const assertCommandStreamError = async ({
  endpoint,
  stream,
  assertErrorMessageAsExpected,
}: ErrorTestCase): Promise<void> => {
  const results = await stream.execute(new RestCommandStreamExecutor(endpoint));

  const failingCommands: [ICommandFsa, CommandErrorResponseBody][] =
    results.filter(
      (
        next: [
          ICommandFsa,
          CommandSuccessAcknowledgement | CommandErrorResponseBody,
        ],
      ): next is [ICommandFsa, CommandErrorResponseBody] => {
        const [_fsa, result] = next;

        return typeof (result as CommandErrorResponseBody).message === 'string';
      },
    );

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
