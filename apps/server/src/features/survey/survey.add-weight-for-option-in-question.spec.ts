import { buildTestInstance, TrueImpactError } from '../../libs';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const surveyId = '123';

const emptySurvey = buildTestInstance<SurveyPersistenceDto, Survey>(Survey, {
  id: surveyId,
  questions: {},
});

const targetQuestionLabel = '1';

const targetOptionLabel = 'a';

const surveyWithEmptyQuestion = emptySurvey.addFirstQuestion({
  label: targetQuestionLabel,
  prompt: 'How often do you feel happy?',
}) as Survey;

const surveyWithUnweightedOption = surveyWithEmptyQuestion.addOptionToQuestion({
  questionLabel: targetQuestionLabel,
  optionLabel: targetOptionLabel,
  text: 'never',
}) as Survey;

const weightsToAdd = {
  red: 50,
  yellow: 25,
  white: 0,
  black: 0,
};

describe(`Survey.addWeightForOptionInQuestion`, () => {
  describe(`when the target question exists`, () => {
    describe(`when the target option exists`, () => {
      describe(`when the question does not yet have any weights`, () => {
        it(`should add the first set of weights`, () => {
          const result =
            surveyWithUnweightedOption.addWeightsForOptionInQuestion({
              questionLabel: targetQuestionLabel,
              optionLabel: targetOptionLabel,
              weights: weightsToAdd,
            });

          expect(result).toBeInstanceOf(Survey);

          const updatedSurvey = result as Survey;

          const targetOption = updatedSurvey
            .get(targetQuestionLabel)
            ?.get(targetOptionLabel);

          expect(targetOption).toBeTruthy();

          expect(targetOption?.getWeight('red')).toBe(50);
          expect(targetOption?.getWeight('yellow')).toBe(25);
          expect(targetOption?.getWeight('black')).toBe(0);
          expect(targetOption?.getWeight('white')).toBe(0);

          // unknown weights should still return 0
          expect(targetOption?.getWeight('blue')).toBe(0);
        });
      });

      describe(`when the question already has weights`, () => {
        const surveyWithExistingWeights =
          surveyWithUnweightedOption.addWeightsForOptionInQuestion({
            questionLabel: targetQuestionLabel,
            optionLabel: targetOptionLabel,
            weights: {
              blue: 22,
            },
          }) as Survey;

        describe(`when the new weights do not conflict with the existing weights`, () => {
          it(`should add the new weights`, () => {
            const result =
              surveyWithExistingWeights.addWeightsForOptionInQuestion({
                questionLabel: targetQuestionLabel,
                optionLabel: targetOptionLabel,
                weights: weightsToAdd,
              });

            expect(result).toBeInstanceOf(Survey);

            const updatedSurvey = result as Survey;

            const targetOption = updatedSurvey
              .get(targetQuestionLabel)
              ?.get(targetOptionLabel);

            expect(targetOption).toBeTruthy();

            expect(targetOption?.getWeight('red')).toBe(50);
            expect(targetOption?.getWeight('yellow')).toBe(25);
            expect(targetOption?.getWeight('black')).toBe(0);
            expect(targetOption?.getWeight('white')).toBe(0);
            expect(targetOption?.getWeight('blue')).toBe(22);

            // unknown weights should still return 0
            expect(targetOption?.getWeight('orange')).toBe(0);
          });
        });

        describe(`when the new weights conflict with the old weights (same name)`, () => {
          it(`should fail with the expected error`, () => {
            const result =
              surveyWithExistingWeights.addWeightsForOptionInQuestion({
                questionLabel: targetQuestionLabel,
                optionLabel: targetOptionLabel,
                weights: {
                  blue: 44,
                  omaha: 10,
                },
              });

            expect(result).toBeInstanceOf(TrueImpactError);

            const message = (result as TrueImpactError).toString();

            expect(message).toContain(targetOptionLabel);
            expect(message).toContain('already');
            expect(message).toContain('blue');
            // existing value
            expect(message).toContain('22');
            // new value
            expect(message).toContain('44');
          });
        });
      });
    });

    describe(`when the target option does not exist`, () => {
      it(`should have a test`, () => {
        const result = surveyWithEmptyQuestion.addWeightsForOptionInQuestion({
          questionLabel: targetQuestionLabel,
          optionLabel: targetOptionLabel,
          weights: {
            foo: 123,
          },
        });

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(targetQuestionLabel);
        expect(message).toContain(targetOptionLabel);
        expect(message).toContain('no such option');
      });
    });
  });

  describe(`when the target question does not exist`, () => {
    it(`should return the expected error`, () => {
      const result = emptySurvey.addWeightsForOptionInQuestion({
        questionLabel: targetQuestionLabel,
        optionLabel: targetOptionLabel,
        weights: {
          foo: 555,
        },
      });

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(targetQuestionLabel);
      expect(message).toContain(targetOptionLabel);
      expect(message).toContain('no such question');
    });
  });
});
