import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import {
  Survey,
  SurveyPersistenceDto,
} from '../survey-management/survey.aggregate-root';
import {
  SurveyResponseRecord,
  SurveyResponseRecordPersistenceDto,
} from './survey-response-record.aggregate-root';

/**
 * 1 - 2
 * 3
 */
const testSurvey = buildTestInstance<SurveyPersistenceDto>(Survey, {
  isPublished: true,
  topLevelQuestionLabels: ['1', '3'],
  questions: {
    '1': {
      prompt: 'Do you like this survey',
      options: {
        a: {
          text: 'yes',
        },
        b: {
          text: 'no',
          nextQuestionLabel: '2',
        },
      },
    },
    '2': {
      prompt: 'Could you possibly change your opinion?',
      options: {
        a: {
          text: 'yes',
        },
        b: {
          text: 'no',
        },
        c: {
          text: 'maybe',
        },
      },
    },
    '3': {
      prompt: 'Do you sleep on the job?',
      options: {
        a: {
          text: 'often',
        },
        b: {
          text: 'never',
        },
      },
    },
  },
}) as Survey;

const testSurveyDto = testSurvey.toPersistenceDto();

const completedSurvey = buildTestInstance<SurveyResponseRecordPersistenceDto>(
  SurveyResponseRecord,
  {
    survey: testSurveyDto,
    responses: [
      {
        questionLabel: '1',
        optionLabel: 'b',
      },
      {
        questionLabel: '2',
        optionLabel: 'c',
      },
      {
        questionLabel: '3',
        optionLabel: 'a',
      },
    ],
  },
) as SurveyResponseRecord;

describe(`SurveyResponseRecord.abandon`, () => {
  describe(`when the survey completion is still in progress`, () => {
    const surveyResponseInProgress =
      // TODO why do we need the generic here?
      buildTestInstance<SurveyResponseRecordPersistenceDto>(
        SurveyResponseRecord,
        {
          survey: testSurvey.toPersistenceDto(),
          responses: [
            {
              questionLabel: '1',
              optionLabel: 'b',
            },
            {
              questionLabel: '2',
              optionLabel: 'c',
            },
          ],
        },
      ) as SurveyResponseRecord;

    it(`should update the survey response record`, () => {
      const result = surveyResponseInProgress.abandon();

      expect(result).not.toBeInstanceOf(TrueImpactError);

      const updatedResponseRecord = result as SurveyResponseRecord;

      expect(updatedResponseRecord.hasBeenAbandoned).toEqual(true);
    });
  });

  describe(`when this survey attempt has already been submitted`, () => {
    const submittedSurvey = completedSurvey.submit() as SurveyResponseRecord;

    it(`should return the expected error`, () => {
      const result = submittedSurvey.abandon();

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(completedSurvey.survey.name);
      expect(message).toContain('cannot abandon');
      expect(message).toContain('has already been submitted');
    });
  });

  describe(`when this survey attempt has already been abandoned`, () => {
    const abandonedSurvey =
      buildTestInstance<SurveyResponseRecordPersistenceDto>(
        SurveyResponseRecord,
        {
          hasBeenAbandoned: true,
        },
      ) as SurveyResponseRecord;

    it(`should return the expected error`, () => {
      const result = abandonedSurvey.abandon();

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(abandonedSurvey.survey.name);
      expect(message).toContain('has already been abandoned');
    });
  });
});
