import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import {
  Survey,
  SurveyPersistenceDto,
} from '../survey-management/survey.aggregate-root';
import {
  SurveyResponseRecord,
  SurveyResponseRecordPersistenceDto,
} from './survey-response-record.aggregate-root';

const surveyWithOneQuestion = buildTestInstance<SurveyPersistenceDto>(Survey, {
  topLevelQuestionLabels: ['1'],
  questions: {
    '1': {
      label: '1',
      prompt: 'What do you think of my survey?',
      options: {
        a: {
          label: 'a',
          text: 'it is good',
        },
        b: {
          label: 'b',
          text: 'it is bad',
        },
      },
    },
  },
}) as Survey;

const emptyResponseRecordWithOneQuestion =
  buildTestInstance<SurveyResponseRecordPersistenceDto>(SurveyResponseRecord, {
    responses: [],
    survey: surveyWithOneQuestion.toPersistenceDto(),
  }) as SurveyResponseRecord;

const completedSurvey = emptyResponseRecordWithOneQuestion.answerQuestion(
  '1',
  'a',
) as SurveyResponseRecord;

describe(`SurveyResponseRecord.submit`, () => {
  describe(`when the survey has not yet been submitted`, () => {
    describe(`when the survey has responses for all questions`, () => {
      it(`should update the survey's status to submitted`, () => {
        const result = completedSurvey.submit();

        expect(result).not.toBeInstanceOf(TrueImpactError);

        const updatedRecord = result as SurveyResponseRecord;

        expect(updatedRecord.hasBeenSubmitted).toBe(true);
      });
    });

    describe(`when the survey is missing responses for a question`, () => {
      it(`should return the expected error`, () => {
        const result = emptyResponseRecordWithOneQuestion.submit();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain('cannot submit');
        expect(message).toContain(
          emptyResponseRecordWithOneQuestion.survey.name,
        );
        expect(message).toContain('has not been fully completed');
      });
    });
  });

  describe(`when the survey has already been submitted`, () => {
    it(`should return the expected error message`, () => {
      const submittedSurvey = completedSurvey.submit() as SurveyResponseRecord;

      const result = submittedSurvey.submit();

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(completedSurvey.survey.name);
      expect(message).toContain('cannot submit');
      expect(message).toContain('has already been submitted');
    });
  });

  describe(`when the survey has been abandoned`, () => {
    it(`should return an error with the expected message`, () => {
      const abandonedResponseRecord =
        emptyResponseRecordWithOneQuestion.abandon() as SurveyResponseRecord;

      const result = abandonedResponseRecord.submit();

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(abandonedResponseRecord.survey.name);
      expect(message).toContain('cannot submit');
      expect(message).toContain('has been abandoned');
    });
  });
});
