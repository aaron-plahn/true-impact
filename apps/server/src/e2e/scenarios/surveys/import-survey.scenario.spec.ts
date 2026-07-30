import { SurveyViewModelClientDto } from '../../../features/survey/queries/survey.view-model';
import {
  ImportSurvey,
  SurveyOptionImportDto,
  SurveyQuestionImportDto,
} from '../../../features/survey/survey-management';
import { TestCommandStream } from '../../../libs/cqrs-es';
import { assertCommandScenarioSuccess } from '../utils';
import { signInAsAdmin } from '../utils/sign-in';
import { TestHttpClient } from '../utils/test-http-client';

// TODO From env.e2e
const port = '3234';

const baseEndpoint = `http://localhost:${port}`;

const surveyIndexEndpoint = `${baseEndpoint}/surveys`;

const surveyCommandsEndpoint = `${surveyIndexEndpoint}/commands`;

const surveyTestSetupEndpoint = `${surveyIndexEndpoint}/test-setup`;

const surveyName = 'Evaluation 1.B';

const shouldError = 'should return the expected error';

const httpClient = new TestHttpClient('http://localhost:4200');

describe(`Survey Import Scenarios`, () => {
  beforeAll(async () => {
    // TODO test when the user does not have sufficient permissions
    // We ensure the user has permission to execute commands
    await signInAsAdmin(httpClient);
  });

  beforeEach(async () => {
    await httpClient.patch(surveyTestSetupEndpoint);
  });

  describe(`when the import is valid`, () => {
    describe(`when an analyzer is provided`, () => {
      it.todo(
        `should create a published (finalized) survey with the given analyzer`,
      );
    });

    const newFlag = 'flight risk';

    const optionA: SurveyOptionImportDto = {
      label: 'a',
      text: 'yes',
      flags: [newFlag],
      valuesByAnalyzerName: {},
    };

    const question1: SurveyQuestionImportDto = {
      prompt: 'Do you ever want to just leave it all behind?',
      label: '1',
      options: [
        optionA,
        {
          label: 'b',
          text: 'no',
          flags: [],
          valuesByAnalyzerName: {},
        },
        {
          label: 'c',
          text: 'maybe',
          flags: [],
          valuesByAnalyzerName: {},
          followUpQuestion: {
            label: '1.1',
            prompt: 'Do you often wish you were somewhere else?',
            options: [
              {
                label: 'a',
                text: 'yes',
                flags: [newFlag],
                valuesByAnalyzerName: {},
              },
            ],
          },
        },
      ],
    };

    describe(`when no analyzer is provided`, () => {
      const validImport = TestCommandStream.first(ImportSurvey, {
        name: {
          text: surveyName,
        },
        analyzers: [],
        questions: [question1],
      });

      it(`should create the published (finalized survey)`, async () => {
        await assertCommandScenarioSuccess({
          httpClient,
          endpoint: surveyCommandsEndpoint,
          stream: validImport,
          assertSuccess: async (acks) => {
            const { id } = acks[0];

            const searchResult = (
              await httpClient.get(`${surveyIndexEndpoint}/${id}`)
            ).data as SurveyViewModelClientDto;

            expect(searchResult.name).toBe(surveyName);

            // TODO check entire survey
          },
        });
      });
    });
  });

  describe(`when the import is invalid`, () => {
    describe(`when no questions are provided`, () => {
      it.todo(shouldError);
    });

    describe(`when one of the questions has too few options`, () => {
      describe(`0 options`, () => {
        it.todo(shouldError);
      });

      describe(`1 option`, () => {
        it.todo(shouldError);
      });
    });

    describe(`when an analyzer is invalid`, () => {
      describe(`when it has no categories`, () => {
        it.todo(shouldError);
      });

      describe(`when an option references an unlisted analyzer`, () => {
        it.todo(`should error`);
      });

      describe(`when an option references an unlisted category for a listed analyzer`, () => {
        it.todo(shouldError);
      });
    });
  });
});
