import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { DONE } from '../constants';
import {
  Survey,
  SurveyPersistenceDto,
} from '../survey-management/survey.aggregate-root';
import { SurveyResponseRecord } from './survey-response-record.aggregate-root';

const targetQuestionLabel = '2';
const targetOptionLabel = 'c';

const survey = buildTestInstance<SurveyPersistenceDto>(Survey, {
  isPublished: true,
  /**
   * It's awkward that there is overlap between this and the questions.
   * Can we find a more graph-like DTO structure?
   */
  topLevelQuestionLabels: '13'.split(''),
  questions: {
    '1': {
      prompt: 'How good is my survey?',
      options: {
        a: {
          text: 'good',
        },
        b: {
          text: 'real good',
        },
        c: {
          text: 'great!',
        },
        d: {
          text: 'boo!',
          nextQuestionLabel: '2',
        },
      },
    },
    [targetQuestionLabel]: {
      prompt: 'What is wrong with you?',
      options: {
        a: {
          text: 'I am mean',
        },
        b: {
          text: 'I have high standards',
        },
        [targetOptionLabel]: {
          text: 'Your survey is not as good as you think :(',
        },
      },
    },
    '3': {
      prompt: 'Will you answer my survey again?',
      options: {
        a: {
          text: 'yes',
        },
        b: {
          text: 'no',
        },
        c: {
          text: 'maybe so',
        },
      },
    },
  },
}) as Survey;

const surveyResponseRecord = buildTestInstance(SurveyResponseRecord, {
  survey: survey.toPersistenceDto(),
  responses: [
    {
      questionLabel: '1',
      optionLabel: 'd',
    },
  ],
});

describe(`SurveyResponseRecord.answerQuestion`, () => {
  describe(`when the survey has not yet been submitted`, () => {
    describe(`when the target question exists`, () => {
      describe(`when the target option exists`, () => {
        describe(`when there is not yet an answer for this question`, () => {
          const emptySurvey = buildTestInstance(SurveyResponseRecord, {
            survey: survey.toPersistenceDto(),
            responses: [],
          });

          describe(`when answering the first question in a survey`, () => {
            it(`should update the responses`, () => {
              const result = emptySurvey.answerQuestion('1', 'a');

              expect(result).not.toBeInstanceOf(TrueImpactError);

              const updatedSurveyRecord = result as SurveyResponseRecord;

              expect(updatedSurveyRecord.isComplete()).toBe(false);

              // note that question 2 is a follow-up question for 1.d
              expect(updatedSurveyRecord.nextQuestionLabel).toBe('3');
              expect(updatedSurveyRecord.progress()).toEqual({
                completed: 1,
                count: 3,
              });
            });
          });

          describe(`when answering the second question in a survey`, () => {
            it(`should update the responses`, () => {
              const result = surveyResponseRecord.answerQuestion(
                targetQuestionLabel,
                targetOptionLabel,
              );

              expect(result).not.toBeInstanceOf(TrueImpactError);

              const updatedRecord = result as SurveyResponseRecord;

              expect(updatedRecord.progress()).toEqual({
                completed: 2,
                count: 3,
              });

              expect(updatedRecord.isComplete()).toBe(false);

              expect(updatedRecord.getNextQuestionLabel()).toBe('3');
            });
          });

          describe(`when answering the last question in a survey`, () => {
            it(`should update the responses`, () => {
              const preliminaryResult = surveyResponseRecord.answerQuestion(
                '2',
                'c',
              ) as SurveyResponseRecord;

              const result = preliminaryResult.answerQuestion('3', 'a');

              expect(result).not.toBeInstanceOf(TrueImpactError);

              const updatedSurveyRecord = result as SurveyResponseRecord;

              expect(updatedSurveyRecord.isComplete()).toBe(true);

              expect(updatedSurveyRecord.nextQuestionLabel).toBe(DONE);

              expect(updatedSurveyRecord.progress()).toEqual({
                completed: 3,
                count: 3,
              });
            });
          });
        });

        describe(`when there is already an answer for the target question`, () => {
          it(`should return the expected error`, () => {
            const preliminaryResult = surveyResponseRecord.answerQuestion(
              targetQuestionLabel,
              targetOptionLabel,
            ) as SurveyResponseRecord;

            const result = preliminaryResult.answerQuestion(
              targetQuestionLabel,
              targetOptionLabel,
            );

            expect(result).toBeInstanceOf(TrueImpactError);

            const message = (result as TrueImpactError).toString();

            expect(message).toContain(surveyResponseRecord.survey.name);
            expect(message).toContain(targetQuestionLabel);
            expect(message).toContain(targetOptionLabel);
            expect(message).toContain('cannot answer');
            expect(message).toContain('already');
          });
        });

        describe(`when this is not the next question in the survey`, () => {
          it(`should return the expected error`, () => {
            const outOfOrderQuestionLabel = '3';

            const result = surveyResponseRecord.answerQuestion(
              outOfOrderQuestionLabel,
              'a',
            );

            expect(result).toBeInstanceOf(TrueImpactError);

            const message = (result as TrueImpactError).toString();

            expect(message).toContain(surveyResponseRecord.survey.name);
            expect(message).toContain(outOfOrderQuestionLabel);
            expect(message).toContain('cannot answer');
            expect(message).toContain('not the next question');
            expect(message).toContain('2');
          });
        });
      });

      describe(`when the target option does not exist`, () => {
        it(`should return the expected error`, () => {
          const bogusOptionLabel = 'z';

          const result = surveyResponseRecord.answerQuestion(
            targetQuestionLabel,
            bogusOptionLabel,
          );

          expect(result).toBeInstanceOf(TrueImpactError);

          const message = (result as TrueImpactError).toString();

          expect(message).toContain(targetQuestionLabel);
          expect(message).toContain(bogusOptionLabel);
          expect(message).toContain(surveyResponseRecord.survey.name);
          expect(message).toContain(`no such option`);
        });
      });
    });

    describe(`when the target question does not exist`, () => {
      it(`should return the expected error`, () => {
        const bogusQuestionLabel = '5';

        const result = surveyResponseRecord.answerQuestion(
          bogusQuestionLabel,
          'a',
        );

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(surveyResponseRecord.survey.name);
        expect(message).toContain(bogusQuestionLabel);
        expect(message).toContain('no such question');
      });
    });

    describe(`when the survey has already been submitted`, () => {
      const submittedSurveyResponse = buildTestInstance(SurveyResponseRecord, {
        survey: survey.toPersistenceDto(),
        hasBeenAbandoned: false,
        hasBeenSubmitted: true,
        responses: [
          {
            questionLabel: '1',
            optionLabel: 'a',
          },
          {
            questionLabel: '3',
            optionLabel: 'b',
          },
        ],
      });

      it(`should fail with the expected error`, () => {
        const result = submittedSurveyResponse.answerQuestion('2', 'a');

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(submittedSurveyResponse.survey.name);
        expect(message).toContain('cannot answer question');
        expect(message).toContain('2');
        expect(message).toContain('already been submitted');
      });
    });
  });

  describe(`when the survey has been abandoned`, () => {
    const submittedSurveyResponse = buildTestInstance(SurveyResponseRecord, {
      survey: survey.toPersistenceDto(),
      hasBeenAbandoned: true,
      hasBeenSubmitted: false,
      responses: [
        {
          questionLabel: '1',
          optionLabel: 'a',
        },
      ],
    });

    it(`should fail with the expected error`, () => {
      const result = submittedSurveyResponse.answerQuestion('3', 'a');

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(submittedSurveyResponse.survey.name);
      expect(message).toContain('cannot answer question');
      expect(message).toContain('3');
      expect(message).toContain('been abandoned');
    });
  });
});
