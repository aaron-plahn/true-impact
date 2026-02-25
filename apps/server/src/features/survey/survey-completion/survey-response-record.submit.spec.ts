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
  isPublished: true,
  // This is a bit painful- can we use a different format?
  topLevelQuestionLabels: ['1', '3'],
  // TODO ensure the prompts are unique amongst all questions in a single survey
  questions: {
    '1': {
      prompt: 'What do you think of my survey?',
      options: {
        a: {
          text: 'it is good',
        },
        b: {
          text: 'it is bad',
          nextQuestionLabel: '2',
        },
      },
    },
    '2': {
      prompt: 'Why do you think it is bad?',
      options: {
        a: {
          text: 'because it is',
        },
        b: {
          text: 'because I woke up on the wrong side of the bed',
        },
      },
    },
    '3': {
      prompt: 'Will you have a nice day?',
      options: {
        // TODO Ensure the text is unique amongst all options for a single question
        a: {
          text: 'yes',
        },
        b: {
          text: 'no',
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

const completedSurveyWithEveryOptionalQuestionCompleted = [
  ['1', 'b'],
  ['2', 'b'],
  ['3', 'a'],
].reduce((acc, [questionLabel, optionLabel]) => {
  return acc.answerQuestion(questionLabel, optionLabel) as SurveyResponseRecord;
}, emptyResponseRecordWithOneQuestion);

const completedSurveyWithEmptyOptionalQuestions = [
  ['1', 'a'],
  ['3', 'b'],
].reduce((acc, [questionLabel, optionLabel]) => {
  return acc.answerQuestion(questionLabel, optionLabel) as SurveyResponseRecord;
}, emptyResponseRecordWithOneQuestion);

const assertSuccessfulSubmission = (result: unknown) => {
  expect(result).not.toBeInstanceOf(TrueImpactError);

  const updatedRecord = result as SurveyResponseRecord;

  expect(updatedRecord.hasBeenSubmitted).toBe(true);
};

describe(`SurveyResponseRecord.submit`, () => {
  describe(`when the survey has not yet been submitted`, () => {
    describe(`when the survey has responses for all questions`, () => {
      it(`should update the survey's status to submitted`, () => {
        const result =
          completedSurveyWithEveryOptionalQuestionCompleted.submit();

        assertSuccessfulSubmission(result);
      });
    });

    describe(`when the survey has responses for all required questions, but some questions were not required`, () => {
      it(`should have a test`, () => {
        const result = completedSurveyWithEmptyOptionalQuestions.submit();

        assertSuccessfulSubmission(result);
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
      const submittedSurvey =
        completedSurveyWithEveryOptionalQuestionCompleted.submit() as SurveyResponseRecord;

      const result = submittedSurvey.submit();

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(
        completedSurveyWithEveryOptionalQuestionCompleted.survey.name,
      );
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
