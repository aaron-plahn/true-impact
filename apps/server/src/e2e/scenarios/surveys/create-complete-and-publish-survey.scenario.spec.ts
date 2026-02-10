// TODO export our own HttpStatus from `framework`
import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CommandSuccessAcknowledgement, ICommandFsa } from 'src/libs/cqrs-es';
import { CreateSurvey } from '../../../features/survey/commands/create-survey.command';
// Do we really want a barrel export from `libs`??
import { TestCommandStream } from '../../../libs/cqrs-es/test-utils';

const surveyName = 'Staff Evaluation';

const surveyId = '123';

const createSurvey = TestCommandStream.first(CreateSurvey, {
  name: surveyName,
});

// TODO From env.e2e
const port = '3001';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const commandEndpoint = `${surveyIndexEndpoint}/execute`;

const testSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

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

type ErrorTestCase = {
  endpoint: string;
  setupCommandFsaStream?: ICommandFsa[];
  invalidCommandFsa: ICommandFsa;
  assertErrorMessage?: (message: string) => void;
};

const assertCommandError = async ({
  endpoint,
  setupCommandFsaStream: setupCommands,
  invalidCommandFsa,
  assertErrorMessage,
}: ErrorTestCase): Promise<void> => {
  /**
   * ARRANGE
   *
   * We use a command stream to set up the initial state via the API.
   */
  for (const fsa of setupCommands || []) {
    await assertCommandSuccess({ endpoint, commandFsa: fsa });
  }

  /**
   * ACT
   */
  const response = await axios
    .post(endpoint, invalidCommandFsa)
    .catch(
      (e: { status: HttpStatus; response: { data: { message: string } } }) => {
        return {
          status: e.status,
          message: e.response.data.message,
        };
      },
    );

  expect(response.status).toBe(HttpStatus.BAD_REQUEST);

  const { message } = response as {
    message: string;
  };

  if (typeof assertErrorMessage === 'function') {
    assertErrorMessage(message);
  }
};

const assertQueryResponse = async <TBody = Record<string, unknown>>({
  endpoint,
  assertResponseBody,
}: {
  endpoint: string;
  assertResponseBody?: (body: TBody) => Promise<void>;
}): Promise<void> => {
  const result = await axios.get(endpoint);

  expect(result.status).toBe(HttpStatus.OK);

  const body = result.data as TBody;

  if (typeof assertResponseBody === 'function') {
    await assertResponseBody(body);
  }
};

describe(`Survey Management Scenarios`, () => {
  beforeEach(async () => {
    await axios.patch(testSetupEndpoint);
  });

  describe(`create, complete, and publish a survey`, () => {
    describe(`when creating a survey`, () => {
      describe(`when the request is valid`, () => {
        it(`should return the expected acknowledgement`, async () => {
          await assertCommandSuccess({
            endpoint: commandEndpoint,
            commandFsa: createSurvey.as({
              id: surveyId,
            })[0],
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
            await assertCommandError({
              endpoint: commandEndpoint,
              setupCommandFsaStream: [createSurvey.as({ id: surveyId })[0]],
              invalidCommandFsa: createSurvey.as({ id: surveyId })[0],
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

    describe(`when adding a first question to a survey`, () => {});
  });
});
