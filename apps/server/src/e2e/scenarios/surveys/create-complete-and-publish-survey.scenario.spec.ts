// TODO export our own HttpStatus from `framework`
import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CommandSuccessAcknowledgement } from 'src/libs/cqrs-es';
import { CreateSurvey } from '../../../features/survey/commands/create-survey.command';
// Do we really want a barrel export from `libs`??
import { TrueImpactError, TrueImpactRuntimeException } from '../../../libs';
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

describe(`Survey Management Scenarios`, () => {
  beforeEach(async () => {
    await axios.patch(testSetupEndpoint);
  });

  describe(`create, complete, and publish a survey`, () => {
    describe(`when creating a survey`, () => {
      describe(`when the request is valid`, () => {
        it(`should return the expected acknowledgement`, async () => {
          const response = await axios
            .post(commandEndpoint, createSurvey.as({ id: surveyId })[0])
            .catch(
              (e: {
                status: HttpStatus;
                response: { data: { message: string } };
              }) => {
                return {
                  status: e.status,
                  message: e.response.data.message,
                };
              },
            );

          // TODO should we separate creation from update command responses?
          expect(response.status).toBe(HttpStatus.CREATED);

          const {
            data: { id },
          } = response as { data: CommandSuccessAcknowledgement };

          const detailEndpoint = buildSurveyDetailEndpoint(id);

          const updatedSurveyResponse = await axios.get(detailEndpoint);

          expect(updatedSurveyResponse.status).toBe(HttpStatus.OK);
        });
      });

      describe(`when the request is invalid`, () => {
        describe(`when there is already a survey with the given name`, () => {
          it(`should return the expected error message`, async () => {
            await axios
              .post(commandEndpoint, createSurvey.as({ id: surveyId })[0])
              .catch((e: { response: { data: { message: string } } }) => {
                throw new TrueImpactRuntimeException([
                  new TrueImpactError(
                    `test setup failed for survey scenario test`,
                  ),
                  new TrueImpactError(e.response.data.message),
                ]);
              });

            const secondCreationAttemptResponse = await axios
              .post(commandEndpoint, createSurvey.as({ id: surveyId })[0])
              .catch(
                (e: {
                  status: HttpStatus;
                  response: { data: { message: string } };
                }) => {
                  return {
                    status: e.status,
                    message: e.response.data.message,
                  };
                },
              );

            expect(secondCreationAttemptResponse.status).toBe(
              HttpStatus.BAD_REQUEST,
            );

            const { message } = secondCreationAttemptResponse as {
              message: string;
            };

            expect(message).toContain(surveyName);

            expect(message).toContain('already');

            expect(message).toContain('unique');
          });
        });
      });
    });
  });
});
