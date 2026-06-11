import { HttpStatus } from '@nestjs/common';
import { CreateGroupProgram } from '../../../features/group-programs/domain/commands/create-group-program.command';
import { TestCommandStream } from '../../../libs/cqrs-es';
import {
  assertCommandScenarioError,
  assertCommandScenarioSuccess,
} from '../utils';
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const groupProgramQueryEndpoint = `${baseEndpoint}/group-programs`;

const groupProgramCommandEndpoint = `${baseEndpoint}/group-programs/commands`;

const programName = "Wreckin' Rollerbladez";

describe(`Group Program Scheduling Scenarios`, () => {
  describe(`when the user is authenticated as admin`, () => {
    const httpClient = new TestHttpClient('http://localhost:3234');

    beforeAll(async () => {
      await signInAsAdmin(httpClient);
    });

    describe(`when creating a group program`, () => {
      describe(`when the request is valid`, () => {
        it(`should create the group program`, async () => {
          await assertCommandScenarioSuccess({
            httpClient,
            endpoint: groupProgramCommandEndpoint,
            stream: TestCommandStream.first(CreateGroupProgram, {
              name: programName,
            }),
            assertSuccess: async (acks) => {
              const { id } = acks[0];

              const result = await httpClient.get(
                `${groupProgramQueryEndpoint}/${id}`,
              );

              expect(result.status).toBe(HttpStatus.OK);
            },
          });
        });
      });
    });

    describe(`when the request is invalid`, () => {
      describe(`when the name is omitted`, () => {
        it(`should return the expected error`, async () => {
          await assertCommandScenarioError({
            httpClient,
            endpoint: groupProgramCommandEndpoint,
            stream: TestCommandStream.first(CreateGroupProgram, {
              // TODO explicitly check '' as well
              name: undefined,
            }),
            assertErrorMessageAsExpected: (message) => {
              expect(message).toContain(`required`);
              expect(message).toContain('name');
            },
          });
        });
      });

      describe(`when the name is already in use by another program`, () => {
        it(`should return the expected error`, async () => {
          await assertCommandScenarioSuccess({
            httpClient,
            endpoint: groupProgramCommandEndpoint,
            stream: TestCommandStream.first(CreateGroupProgram, {
              name: programName,
            }),
          });

          await assertCommandScenarioError({
            endpoint: groupProgramCommandEndpoint,
            stream: TestCommandStream.first(CreateGroupProgram, {
              name: programName,
            }),
            assertErrorMessageAsExpected: (message) => {
              expect(message).toContain(programName);
              expect(message).toContain('already in use');
            },
          });
        });
      });
    });
  });
});
