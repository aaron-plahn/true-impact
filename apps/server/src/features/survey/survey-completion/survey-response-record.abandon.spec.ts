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
  topLevelQuestionLabels: ['1', '3'],
  questions: {
    '1': {
      // TODO Use keys as labels in factory
      label: '1',
      options: {
        a: {
          label: 'a',
          text: 'yes',
        },
        b: {
          label: 'b',
          text: 'no',
          nextQuestionLabel: '2',
        },
      },
    },
    '2': {
      label: '2',
      options: {
        a: {
          label: 'a',
          text: 'yes',
        },
        b: {
          label: 'b',
          text: 'no',
        },
        c: {
          label: 'c',
          text: 'maybe',
        },
      },
    },
    '3': {
      label: '3',
      options: {
        a: {
          label: 'a',
          text: 'often',
        },
        b: {
          label: 'b',
          text: 'never',
        },
      },
    },
  },
}) as Survey;

const completedSurvey = buildTestInstance<SurveyResponseRecordPersistenceDto>(
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
