import { ClientViewModel } from 'src/features/clients/queries';
import { CreateClient } from '../../../features/clients/commands/create-client.command';
import { CreateCommunity } from '../../../features/communities/commands';
import {
  AnswerSurveyQuestion,
  BeginSurvey,
  SubmitSurvey,
} from '../../../features/survey/survey-completion';
import { SurveyResponseRecordViewModelClientDto } from '../../../features/survey/survey-completion/queries/survey-response-record.view-model';
import {
  ImportSurvey,
  OpenSurveyToClient,
} from '../../../features/survey/survey-management';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertCommandScenarioSuccess } from '../utils';
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

// TODO From env.e2e
const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const surveyManagementCommandsEndpoint = `${baseEndpoint}/surveys/commands`;

const surveyResponseRecordIndexEndpoint = `${surveyIndexEndpoint}/responses`;

const surveyCompletionCommandsEndpoint = `${surveyIndexEndpoint}/commands`;

const communityIndexEndpoint = `${baseEndpoint}/communities`;

const communityTestSetupEndpoint = `${communityIndexEndpoint}/test-setup`;

const communityCommandEndpoint = `${communityIndexEndpoint}/commands`;

const clientBaseEndpoint = `${baseEndpoint}/clients`;

const clientCommandsEndpoint = `${clientBaseEndpoint}/commands`;

const clientTestSetupEndpoint = `${clientBaseEndpoint}/test-setup`;

const surveyTestSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const surveyCompletionTestSetupEndpoint = `${surveyResponseRecordIndexEndpoint}/test-setup`;

const reportName = 'medicine wheel';

/**
 * Note that you can also convert this to JSON and use Swagger
 * to import it into a test env.
 *
 * TODO Make this the full evaluation survey, once the clinicians have completed it.
 */
const medicineWheelSurvey: ImportSurvey = {
  name: {
    text: 'DSS Client Evaluation (Medicine Wheel)',
  },
  questions: [
    {
      label: '1',
      prompt: 'How often do you feel sad?',
      options: [
        {
          label: 'a',
          text: 'I sometimes feel sad',
          flags: [
            {
              label: 'my flag',
              description: 'description for test flag',
            },
          ],
          valuesByAnalyzerName: {
            [reportName]: {
              red: 1,
            },
          },
          followUpQuestion: {
            label: '1.1',
            prompt: 'My sadness lasts for',
            options: [
              {
                label: 'a',
                text: 'a few hours',
                flags: [],
                valuesByAnalyzerName: {},
              },
              {
                label: 'b',
                text: 'a few days',
                flags: [],
                valuesByAnalyzerName: {},
              },
              {
                label: 'c',
                text: 'a few weeks',
                flags: [],
                valuesByAnalyzerName: {
                  [reportName]: {
                    black: 1,
                  },
                },
                followUpQuestion: {
                  label: '1.1.1',
                  prompt: 'I am currently seeking help for my sadness',
                  options: [
                    {
                      label: 'a',
                      text: 'yes',
                      flags: [],
                      valuesByAnalyzerName: {},
                    },
                    {
                      label: 'b',
                      text: 'no',
                      flags: [
                        {
                          label: 'requires immediate help',
                          description:
                            'client flagged for immediate intervention',
                        },
                      ],
                      valuesByAnalyzerName: {
                        [reportName]: {
                          red: 1,
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          label: 'b',
          text: 'I never feel sad',
          flags: [],
          valuesByAnalyzerName: {
            [reportName]: {
              white: 1,
            },
          },
        },
      ],
    },
  ],
  analyzers: [
    {
      name: {
        text: reportName,
      },
      categories: ['red', 'white', 'yellow', 'black'],
    },
  ],
};

const _assertSurveyReportCorrectness = () => {
  throw new Error(`helper not implemented`);
};

describe(`Medicine wheel survey completion`, () => {
  const adminHttpClient = new TestHttpClient('localhost:4200');

  let surveyId: string;
  let communityId: string;
  let accessCode: string;
  let clientId: string;

  beforeAll(async () => {
    await signInAsAdmin(adminHttpClient);

    await adminHttpClient.patch(communityTestSetupEndpoint);
    await adminHttpClient.patch(clientTestSetupEndpoint);
    await adminHttpClient.patch(surveyTestSetupEndpoint);
    await adminHttpClient.patch(surveyCompletionTestSetupEndpoint);

    await assertCommandScenarioSuccess({
      httpClient: adminHttpClient,
      endpoint: communityCommandEndpoint,
      stream: TestCommandStream.first(CreateCommunity),
      assertSuccess: (acks) => {
        communityId = acks[0].id;
      },
    });

    await assertCommandScenarioSuccess({
      httpClient: adminHttpClient,
      endpoint: clientCommandsEndpoint,
      stream: TestCommandStream.first(CreateClient, {
        communityId,
      }),
      // note that the client's community is to be provided on the creation command, if known
      assertSuccess: (acks) => {
        clientId = acks[0].id;
      },
    });

    await assertCommandScenarioSuccess({
      httpClient: adminHttpClient,
      endpoint: surveyManagementCommandsEndpoint,
      stream: TestCommandStream.first(
        ImportSurvey,
        medicineWheelSurvey,
      ).andThen(OpenSurveyToClient, {
        clientId,
      }),
      assertSuccess: (acks) => {
        surveyId = acks[0].id;

        accessCode = acks[1].accessCode as string;
      },
    });
  });

  // TODO add several completion scenarios to gain confidence in the calculation (once using the full survey as a fixture)
  describe(`Scenario 1`, () => {
    const participantHttpClient = new TestHttpClient('localhost:4200');

    it(`should return the expected report`, async () => {
      await assertCommandScenarioSuccess({
        httpClient: participantHttpClient,
        endpoint: surveyCompletionCommandsEndpoint,
        // TODO client ID has to be on the payload for the corresponding event!
        stream: TestCommandStream.first(BeginSurvey, { surveyId, accessCode })
          .andThen(AnswerSurveyQuestion, {
            // red -> 1
            questionLabel: '1',
            chosenOptionLabel: 'a',
          })
          .andThen(AnswerSurveyQuestion, {
            // black -> 1
            questionLabel: '1.1',
            chosenOptionLabel: 'c',
          })
          .andThen(AnswerSurveyQuestion, {
            // red -> 1
            questionLabel: '1.1.1',
            chosenOptionLabel: 'b',
          })
          .andThen(SubmitSurvey),
        assertSuccess: async (acks) => {
          const expectedValuesByCategory = {
            red: 2,
            black: 1,
            white: 0,
            yellow: 0,
          };

          const responseId = acks[0].id;

          const responseViewHttpResponse = await adminHttpClient.get(
            `${surveyResponseRecordIndexEndpoint}/${responseId}`,
          );

          const responseViewFromDetailEndpoint =
            responseViewHttpResponse.data as SurveyResponseRecordViewModelClientDto;

          const assertReportOnSurveyResponseView = (
            responseView: SurveyResponseRecordViewModelClientDto,
          ) => {
            expect(reportName in responseView.reportsByName).toBeTruthy();

            const reportView = responseView.reportsByName[reportName];

            expect(reportView.valuesByCategory).toEqual(
              expectedValuesByCategory,
            );
          };

          assertReportOnSurveyResponseView(responseViewFromDetailEndpoint);

          const clientSearchResponse = await adminHttpClient.get(
            `${clientBaseEndpoint}/${clientId}`,
          );

          const clientView = clientSearchResponse.data as ClientViewModel;

          expect(clientView.surveyResponses).toHaveLength(1);

          const surveyResponse = clientView.surveyResponses[0];

          assertReportOnSurveyResponseView(surveyResponse);

          // TODO Do we want to ensure that this report is on the index views as well?
        },
      });
    });
  });
});
