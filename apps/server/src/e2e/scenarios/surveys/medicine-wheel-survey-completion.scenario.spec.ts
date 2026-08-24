import { ImportSurvey } from 'src/features/survey/survey-management';

// TODO From env.e2e
const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

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

let clientId: string;

const surveyName = 'Medicine Wheel Client Evaluation Survey';

/**
 * Note that you can also convert this to JSON and use Swagger
 * to import it into a test env.
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
            'medicine wheel': {
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
                valuesByAnalyzerName: {},
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
                      valuesByAnalyzerName: {},
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
            'medicine wheel': {
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
        text: 'medicine wheel',
      },
      categories: ['red', 'white', 'yellow', 'black'],
    },
  ],
};

const _assertSurveyReportCorrectness = () => {
  throw new Error(`helper not implemented`);
};

describe(`Medicine wheel survey completion`, () => {
  describe(`Scenario 1`, () => {});
});
