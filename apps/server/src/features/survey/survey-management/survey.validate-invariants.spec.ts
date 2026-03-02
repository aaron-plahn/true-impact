import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { Survey } from './survey.aggregate-root';

const surveyName = 'my survey';

describe(`Survey.validateInvariants`, () => {
  describe(`when the survey is valid`, () => {
    describe(`when sibling options reference the same follow-up question`, () => {
      const validSurvey = buildTestInstance(
        Survey,
        {
          topLevelQuestionLabels: ['1', '3'],
          questions: {
            '1': {
              prompt: 'Will you investigate my children',
              options: {
                a: {
                  text: 'yes',
                  nextQuestionLabel: '2',
                },
                b: {
                  text: 'maybe',
                  nextQuestionLabel: '2',
                },
                c: {
                  text: 'no',
                },
              },
            },
            '2': {
              prompt: 'Do you like this follow-up question?',
              options: {
                a: {
                  text: 'yes',
                },
                b: {
                  text: 'no',
                },
              },
            },
            '3': {
              prompt: 'How many stars do you give this survey?',
              options: {
                a: {
                  text: '3',
                },
                b: {
                  text: '2',
                },
                c: {
                  text: '1',
                },
              },
            },
          },
        },
        false,
      );

      it(`should return a valid survey`, () => {
        const result = validSurvey.validateInvariants();

        expect(result).toBeInstanceOf(Survey);
      });
    });
  });

  describe(`when the survey is invalid`, () => {
    describe(`when one of the top-level question labels has no corresponding question`, () => {
      const invalidSurvey = buildTestInstance(
        Survey,
        {
          name: surveyName,
          topLevelQuestionLabels: ['1', '2', '3'],
          questions: {
            1: {
              prompt: 'Have you seen my buddy #2?',
            },
            3: {
              prompt: 'Am I really next?',
            },
          },
          isPublished: false,
        },
        false,
      );

      it(`should return the expected error`, () => {
        const result = invalidSurvey.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(surveyName);
        expect(message).toContain('missing question');
        expect(message).toContain('2');
      });
    });

    // We avoid this to prevent loops
    describe(`when a top-level question is used as a follow-up question`, () => {
      const invalidSurvey = buildTestInstance(
        Survey,
        {
          name: surveyName,
          topLevelQuestionLabels: ['1'],
          questions: {
            1: {
              prompt: 'Why so loopy?',
              options: {
                a: {
                  text: "I don't know",
                },
                b: {
                  text: 'Ask me again!',
                  nextQuestionLabel: '1',
                },
              },
            },
          },
        },
        false,
      );

      it(`should return the expected error`, () => {
        const result = invalidSurvey.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(surveyName);
        expect(message).toContain(`contains a loop`);
        expect(message).toContain(`1 -> b -> 1`);
      });
    });

    describe(`when a there is a loop amongst follow-up questions`, () => {
      const invalidSurvey = buildTestInstance(
        Survey,
        {
          name: surveyName,
          topLevelQuestionLabels: ['1'],
          questions: {
            1: {
              prompt: 'Can you find an issue with my follow-up questions?',
              options: {
                a: {
                  text: 'yes',
                  nextQuestionLabel: '2',
                },
                b: {
                  text: 'no',
                },
              },
            },
            2: {
              prompt: 'Are you on the right track?',
              options: {
                a: {
                  text: 'no',
                },
                b: {
                  text: 'yes',
                  nextQuestionLabel: '3',
                },
              },
            },
            3: {
              prompt: 'Did you get it right?',
              options: {
                a: {
                  text: 'yes',
                  nextQuestionLabel: '2',
                },
                b: {
                  text: 'no',
                },
              },
            },
          },
        },
        false,
      );

      it(`should return the expected error`, () => {
        const result = invalidSurvey.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(surveyName);
        expect(message).toContain(`repeated question`);
        expect(message).toContain(`2`);
      });
    });
  });
});
