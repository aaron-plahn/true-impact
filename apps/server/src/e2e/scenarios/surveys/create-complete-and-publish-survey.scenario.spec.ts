// TODO export our own HttpStatus from `framework`
import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CreateSurvey } from '../../../features/survey/commands/create-survey.command';
import {
  CommandSuccessAcknowledgement,
  ICommandFsa,
} from '../../../libs/cqrs-es';
// Do we really want a barrel export from `libs`??
import { AddQuestionToSurvey } from '../../../features/survey/commands/add-question-to-survey.command';
import { SurveyViewModel } from '../../../features/survey/queries/survey.view-model';
import { TestCommandStream } from '../../../libs/cqrs-es/test-utils';

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const commandEndpoint = `${surveyIndexEndpoint}/execute`;

const testSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

class RestCommandStreamExecutor {
  constructor(private readonly endpoint: string) {}

  async execute(fsa: ICommandFsa) {
    const response = await axios
      .post(this.endpoint, fsa)
      .catch(
        (e: {
          status: HttpStatus;
          response: { data: { message: string } };
        }) => {
          return {
            status: e.status,
            data: {
              message: e.response.data.message,
            },
          };
        },
      );

    const result = response.data as CommandSuccessAcknowledgement;

    return result;
  }
}

const surveyName = 'Staff Evaluation';

const createSurvey = TestCommandStream.first(CreateSurvey, {
  name: surveyName,
});

const questionLabels = '1234'.split('');

const questionPrompts = questionLabels.map(
  (l) => `This is the prompt for test question [${l}].`,
);

const addFirstQuestionToSurvey = createSurvey.andThen(AddQuestionToSurvey, {
  label: questionLabels[0],
  prompt: questionPrompts[0],
});

const _addRemainingQuestionsToSurvey = questionLabels.slice(1).reduce(
  (stream, label, index) =>
    stream.andThen(AddQuestionToSurvey, {
      label,
      prompt: questionPrompts[index + 1],
    }),
  addFirstQuestionToSurvey,
);

const buildSurveyDetailEndpoint = (id: string) =>
  `${surveyIndexEndpoint}/${id}`;

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

const assertCommandSuccess = async ({
  endpoint,
  commandFsa,
  assert: assertSuccess,
}: SuccessTestCase) => {
  const response = await axios
    .post(endpoint, commandFsa)
    .catch(
      (e: { status: HttpStatus; response: { data: { message: string } } }) => {
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
    // @ts-expect-error Let's fix this one
    body: response.data as CommandSuccessAcknowledgement,
  } as unknown as SuccessResponse;

  if (typeof assertSuccess === 'function') {
    await assertSuccess(successResponse);
  }
};

const assertScenarioSuccess = async ({
  endpoint,
  stream,
  // name,
  assertSuccess: assertSuccessResponse,
}: {
  endpoint: string;
  stream: TestCommandStream;
  // name: string;
  assertSuccess?: (acks: CommandSuccessAcknowledgement[]) => Promise<void>;
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
  assertErrorMessage?: (message: string) => void;
};

const assertCommandStreamError = async ({
  endpoint,
  stream,
  assertErrorMessage,
}: ErrorTestCase): Promise<void> => {
  const results = await stream.execute(new RestCommandStreamExecutor(endpoint));

  const failingCommands: [ICommandFsa, { message: string }][] = results.filter(
    (
      next: [ICommandFsa, CommandSuccessAcknowledgement | { message: string }],
    ): next is [ICommandFsa, { message: string }] => {
      const [_fsa, result] = next;

      return typeof (result as { message: string }).message === 'string';
    },
  );

  expect(failingCommands).toHaveLength(1);

  const resultForLastCommand = failingCommands.at(-1)?.[1];

  // TODO Expose a CommandErrorResponseBody type
  expect((resultForLastCommand as { message: string }).message).toBeTruthy();

  if (
    typeof resultForLastCommand?.toString === 'function' &&
    typeof assertErrorMessage === 'function'
  ) {
    assertErrorMessage(resultForLastCommand.message);
  }
};

const assertQueryResponse = async <TBody = Record<string, unknown>>({
  endpoint,
  assertResponseBody,
}: {
  endpoint: string;
  assertResponseBody?: (body: TBody) => Promise<void>;
}): Promise<void> => {
  const result = await axios
    .get(endpoint)
    .catch(
      (e: { status: HttpStatus; response: { data: { message: string } } }) => {
        return {
          status: e.status,
          message: e.response.data.message,
        };
      },
    );

  expect(result.status).toBe(HttpStatus.OK);

  // @ts-expect-error TODO Fix types
  const body = result.data as TBody;

  if (typeof assertResponseBody === 'function') {
    await assertResponseBody(body);
  }
};

describe(`Survey Management Scenarios`, () => {
  beforeEach(async () => {
    // TODO Deal with seeding an admin user who has survey management permissions
    await axios.patch(testSetupEndpoint);
  });

  describe(`create, complete, and publish a survey`, () => {
    describe(`when creating a survey`, () => {
      describe(`when the request is valid`, () => {
        it(`should return the expected acknowledgement`, async () => {
          await assertCommandSuccess({
            endpoint: commandEndpoint,
            commandFsa: createSurvey.getCreationCommand(),
            assert: async (response) => {
              const {
                body: { id },
                status,
              } = response;

              expect(status).toBe(HttpStatus.CREATED);

              await assertQueryResponse({
                endpoint: buildSurveyDetailEndpoint(id),
              });
            },
          });
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when there is already a survey with the given name`, () => {
          it(`should return the expected error message`, async () => {
            await assertScenarioSuccess({
              endpoint: commandEndpoint,
              stream: createSurvey,
            });

            await assertCommandStreamError({
              endpoint: commandEndpoint,
              stream: createSurvey,
              assertErrorMessage: (message: string) => {
                expect(message).toContain(surveyName);

                expect(message).toContain('already');

                expect(message).toContain('unique');
              },
            });
          });
        });
      });
    });

    describe(`when adding a first question to a survey`, () => {
      describe(`when the request is valid`, () => {
        it(`should succeed`, async () => {
          await assertScenarioSuccess({
            endpoint: commandEndpoint,
            stream: addFirstQuestionToSurvey,
            assertSuccess: async (acks) => {
              await assertQueryResponse({
                endpoint: buildSurveyDetailEndpoint(acks[0].id),
                assertResponseBody: async (body: SurveyViewModel) => {
                  expect(body.name).toBe(surveyName);

                  expect(body.size).toBe(1);

                  // TODO This shouldn't be necessary
                  return Promise.resolve();
                },
              });
            },
          });
        });
      });
    });
  });
});
