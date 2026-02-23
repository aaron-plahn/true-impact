import { buildTestInstance } from '../../libs';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const testSurvey: Survey = buildTestInstance<SurveyPersistenceDto, Survey>(
  Survey,
  {
    questionLabels: '123456789'.split(''),
    /**
     * 1 - 4
     * 2
     * 3 - 5 - 6
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
      },
    },
  },
);

describe(`Survey.getNextQuestionLabel`, () => {
  describe(`when the survey has a flat structure`, () => {
    describe(`when seeking the successor to the first question`, () => {
      it.todo(`should return the expected question label`);
    });

    describe(`when seeking the successor to an interior question`, () => {
      it.todo(`should return the expected question label`);
    });

    describe(`when seeking the successor to the penultimate question`, () => {
      it(`should return the last question's label`);
    });

    describe(`when seeking the successor to the final question`, () => {
      it(`should return DONE`);
    });
  });

  describe(`when the survey has a deeply nested structure`, () => {
    describe(`when seeking the successor to a question with no follow-up questions`, () => {
      it(`should return the next top-level question's label`, () => {
        const result = testSurvey.getNextQuestionLabel('4', 'c');

        expect(result).toBe('2');
      });
    });

    describe(`when seeking the next question after an interior question`, () => {
      describe(`when the question has a follow-up question based on the chosen option`, () => {
        it.todo(`should return the follow-up question's label`);
      });

      describe(`when the question has no follow-up question based on the chosen option`, () => {
        describe(`when there is a next top-level question`, () => {
          it(`should return the expected question label`, () => {
            const result = testSurvey.getNextQuestionLabel('2', 'b');

            expect(result).toBe('3');
          });
        });

        describe(`when there is no next top-level question`, () => {
          it.todo(`should return DONE`);
        });
      });
    });
  });
});
