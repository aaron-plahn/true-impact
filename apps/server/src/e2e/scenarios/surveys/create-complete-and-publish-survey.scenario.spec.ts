import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CommandSuccessAcknowledgement } from 'src/libs/cqrs-es';
import { CreateSurvey } from '../../../features/survey/commands/create-survey.command';
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

const buildSurveyDetailEndpoint = (id: string) =>
  `${surveyIndexEndpoint}/${id}`;

describe(`Survey Management Scenarios`, () => {
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
    });
  });
});
