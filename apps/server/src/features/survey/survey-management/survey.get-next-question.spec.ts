import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { DONE } from '../constants';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

describe(`Survey.getNextQuestionLabel`, () => {
  describe(`when the survey has a flat structure`, () => {
    const testSurvey: Survey = buildTestInstance<SurveyPersistenceDto, Survey>(
      Survey,
      {
        topLevelQuestionLabels: '123'.split(''),
        /**
         * 1
         * 2
         * 3
         */
        questions: {
          '1': {
            label: '1',
            prompt: 'How hard do you work?',
            options: {
              a: {
                label: 'a',
                text: '6-6-12',
              },
              b: {
                label: 'b',
                text: 'hard enough',
              },
              c: {
                label: 'c',
                text: 'when I feel like it',
              },
              d: {
                label: 'd',
                text: `who's asking?`,
              },
            },
          },
          '2': {
            label: '2',
            prompt: 'I often take my breaks.',
            options: {
              a: {
                label: 'a',
                text: 'I mostly agree',
              },
              b: {
                label: 'b',
                text: 'I dunno...',
              },
              c: {
                label: 'c',
                text: 'I disagree',
              },
            },
          },
          '3': {
            label: '3',
            prompt: 'I fall asleep at my desk',
            options: {
              a: {
                label: 'a',
                text: 'Often',
                nextQuestionLabel: '5',
              },
              b: {
                label: 'b',
                text: 'Occasionally',
                nextQuestionLabel: '5',
              },
              c: {
                label: 'c',
                text: 'Rarely',
              },
              d: {
                label: 'd',
                text: 'Never',
              },
            },
          },
        },
      },
    );

    describe(`when seeking the successor to the first question`, () => {
      it(`should return the expected question label`, () => {
        const result = testSurvey.getNextQuestionLabel('1', 'a');

        expect(result).toBe('2');
      });
    });

    describe(`when seeking the successor to an interior question`, () => {
      it(`should return the expected question label`, () => {
        const result = testSurvey.getNextQuestionLabel('2', 'b');

        expect(result).toBe('3');
      });
    });

    describe(`when seeking the successor to the final question`, () => {
      it(`should return DONE`, () => {
        const result = testSurvey.getNextQuestionLabel('3', 'c');

        expect(result).toBe(DONE);
      });
    });
  });

  describe(`when the survey has a deeply nested structure`, () => {
    const testSurvey: Survey = buildTestInstance<SurveyPersistenceDto, Survey>(
      Survey,
      {
        topLevelQuestionLabels: '1237'.split(''),
        /**
         * 1 - 4
         * 2
         * 3 - 5 - 6
         * 7
         */
        questions: {
          '1': {
            label: '1',
            prompt: 'How hard do you work?',
            options: {
              a: {
                label: 'a',
                text: '6-6-12',
              },
              b: {
                label: 'b',
                text: 'hard enough',
              },
              c: {
                label: 'c',
                text: 'when I feel like it',
              },
              d: {
                label: 'd',
                text: `who's asking?`,
                nextQuestionLabel: '4',
              },
            },
          },
          '2': {
            label: '2',
            prompt: 'I often take my breaks.',
            options: {
              a: {
                label: 'a',
                text: 'I mostly agree',
              },
              b: {
                label: 'b',
                text: 'I dunno...',
              },
              c: {
                label: 'c',
                text: 'I disagree',
              },
            },
          },
          '3': {
            label: '3',
            prompt: 'I fall asleep at my desk',
            options: {
              a: {
                label: 'a',
                text: 'Often',
                nextQuestionLabel: '5',
              },
              b: {
                label: 'b',
                text: 'Occasionally',
                nextQuestionLabel: '5',
              },
              c: {
                label: 'c',
                text: 'Rarely',
              },
              d: {
                label: 'd',
                text: 'Never',
              },
            },
          },
          '4': {
            label: '4',
            prompt: 'What in the world is wrong with you?',
            options: {
              a: {
                label: 'a',
                text: `The doctors have been unable to determine that`,
              },
              b: {
                label: 'b',
                text: `I'll be honest- I'm lazy!`,
              },
              c: {
                label: 'c',
                text: `I'll try harder, boss, I promise.`,
              },
            },
          },
          '5': {
            label: '5',
            prompt: `Do you sleep 7-8 hours each night?`,
            options: {
              a: {
                label: 'a',
                text: 'Yes',
              },
              b: {
                label: 'a',
                text: 'No',
                nextQuestionLabel: '6',
              },
            },
          },
          '6': {
            label: '6',
            prompt: 'Are you a vampire',
            options: {
              a: {
                label: 'a',
                text: 'Yes',
              },
              b: {
                label: 'b',
                text: 'No',
              },
              c: {
                label: 'c',
                text: `I've not been assessed`,
              },
            },
          },
          7: {
            label: '7',
            prompt: 'Has this been an enjoyable',
            options: {
              a: {
                label: '1',
                text: 'Yes',
              },
              b: {
                label: '2',
                text: 'No',
              },
            },
          },
        },
      },
    );

    describe(`when the request is invalid`, () => {
      describe(`when there is no such question`, () => {
        it(`should return the expected error`, () => {
          const bogusQuestionLabel = '18';

          const result = testSurvey.getNextQuestionLabel(
            bogusQuestionLabel,
            'z',
          );

          expect(result).toBeInstanceOf(TrueImpactError);

          const message = (result as TrueImpactError).toString();

          expect(message).toContain(testSurvey.name);

          expect(message).toContain(bogusQuestionLabel);

          expect(message).toContain('no question');
        });
      });

      describe(`when there is no such option`, () => {
        const targetQuestion = '3';
        const bogusOption = 'XIJ';

        it(`should return the expected error`, () => {
          const result = testSurvey.getNextQuestionLabel(
            targetQuestion,
            bogusOption,
          );

          expect(result).toBeInstanceOf(TrueImpactError);

          const message = (result as TrueImpactError).toString();

          expect(message).toContain(testSurvey.name);
          expect(message).toContain(targetQuestion);
          expect(message).toContain(bogusOption);
          expect(message).toContain('no option');
        });
      });
    });

    describe(`when seeking the successor to a question with no follow-up questions`, () => {
      it(`should return the next top-level question's label`, () => {
        const result = testSurvey.getNextQuestionLabel('2', 'c');

        expect(result).toBe('3');
      });
    });

    describe(`when seeking the next question after an interior question`, () => {
      describe(`when the question has a follow-up question based. on the chosen option`, () => {
        it(`should return the follow-up question's label`, () => {
          const result = testSurvey.getNextQuestionLabel('1', 'd');

          expect(result).toBe('4');
        });
      });

      describe(`when the question has no follow-up question based on the chosen option`, () => {
        describe(`when there is a next top-level question`, () => {
          it(`should return the expected question label`, () => {
            const result = testSurvey.getNextQuestionLabel('2', 'b');

            expect(result).toBe('3');
          });
        });

        describe(`when there is no next top-level question`, () => {
          it(`should return DONE`, () => {
            const result = testSurvey.getNextQuestionLabel('6', 'a');

            expect(result).toBe('7');
          });
        });
      });
    });

    describe(`when seeking the successor to the final question`, () => {
      it(`should return DONE`, () => {
        const result = testSurvey.getNextQuestionLabel('7', 'b');

        expect(result).toBe(DONE);
      });
    });
  });
});
