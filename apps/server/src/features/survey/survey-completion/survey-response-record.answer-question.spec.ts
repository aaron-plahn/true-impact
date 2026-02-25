import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { DONE } from '../constants';
import {
  Survey,
  SurveyPersistenceDto,
} from '../survey-management/survey.aggregate-root';
import {
  SurveyResponseRecord,
  SurveyResponseRecordPersistenceDto,
} from './survey-response-record.aggregate-root';

const targetQuestionLabel = '2';
const targetOptionLabel = 'c';

const survey = buildTestInstance<SurveyPersistenceDto>(Survey, {
  /**
   * It's awkward that there is overlap between this and the questions.
   * Can we find a more graph-like DTO structure?
   */
  topLevelQuestionLabels: '123'.split(''),
  questions: {
    '1': {
      label: '1',
      prompt: 'How good is my survey?',
      options: {
        a: {
          label: 'a',
          text: 'good',
        },
        b: {
          label: 'b',
          text: 'real good',
        },
        c: {
          label: 'c',
          text: 'great!',
        },
        d: {
          label: 'd',
          text: 'boo!',
          nextQuestionLabel: '2',
        },
      },
    },
    [targetQuestionLabel]: {
      label: targetQuestionLabel,
      prompt: 'What is wrong with you?',
      options: {
        a: {
          label: 'a',
          text: 'I am mean',
        },
        b: {
          label: 'b',
          text: 'I have high standards',
        },
        [targetOptionLabel]: {
          label: targetOptionLabel,
          text: 'Your survey is not as good as you think :(',
        },
      },
    },
    '3': {
      label: '3',
      prompt: 'Will you answer my survey again?',
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
          text: 'maybe so',
        },
      },
    },
  },
}) as Survey;

const surveyResponseRecord =
  buildTestInstance<SurveyResponseRecordPersistenceDto>(SurveyResponseRecord, {
    survey: survey.toPersistenceDto(),
    responses: [
      {
        questionLabel: '1',
        optionLabel: 'd',
      },
    ],
  }) as SurveyResponseRecord;

describe(`SurveyResponseRecord.answerQuestion`, () => {
  describe(`when the survey has not yet been submitted`, () => {
    describe(`when the target question exists`, () => {
      describe(`when the target option exists`, () => {
        describe(`when there is not yet an answer for this question`, () => {
          const emptySurvey =
            buildTestInstance<SurveyResponseRecordPersistenceDto>(
              SurveyResponseRecord,
              {
                survey: survey.toPersistenceDto(),
                responses: [],
              },
            ) as SurveyResponseRecord;

          describe(`when answering the first question in a survey`, () => {
            it(`should update the responses`, () => {
              const result = emptySurvey.answerQuestion('1', 'a');

              expect(result).not.toBeInstanceOf(TrueImpactError);

              const updatedSurveyRecord = result as SurveyResponseRecord;

              expect(updatedSurveyRecord.isComplete()).toBe(false);
              expect(updatedSurveyRecord.nextQuestionLabel).toBe('2');
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
      it.todo(`should fail with the expected error`);
    });
  });

  describe(`when the survey has been abandoned`, () => {
    it.todo(`should fail with the expected error`);
  });
});
