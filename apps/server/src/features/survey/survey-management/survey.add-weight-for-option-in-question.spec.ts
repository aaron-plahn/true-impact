import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const surveyId = '123';

const emptySurvey = buildTestInstance<SurveyPersistenceDto, Survey>(Survey, {
  id: surveyId,
  questions: {},
});

const targetQuestionLabel = '1';

const targetOptionLabel = 'a';

const surveyWithEmptyQuestion = emptySurvey.addTopLevelQuestion({
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

// TODO remove these \ move to analyzer
describe(`Survey.addCategoryValueForOptionInQuestion`, () => {
  describe(`when the target question exists`, () => {
    describe(`when the target option exists`, () => {
      describe(`when the question does not yet have any weights`, () => {
        it(`should add the first set of weights`, () => {
          const result =
            surveyWithUnweightedOption.addCategoryValueForOptionInQuestion({
              questionLabel: targetQuestionLabel,
              optionLabel: targetOptionLabel,
              valuesByCategory: weightsToAdd,
            });

          expect(result).toBeInstanceOf(Survey);

          const updatedSurvey = result as Survey;

          const targetOption = updatedSurvey
            .get(targetQuestionLabel)
            ?.get(targetOptionLabel);

          expect(targetOption).toBeTruthy();

          expect(targetOption?.getValue('red')).toBe(50);
          expect(targetOption?.getValue('yellow')).toBe(25);
          expect(targetOption?.getValue('black')).toBe(0);
          expect(targetOption?.getValue('white')).toBe(0);

          // unknown weights should still return 0
          expect(targetOption?.getValue('blue')).toBe(0);
        });
      });

      describe(`when the question already has weights`, () => {
        const surveyWithExistingWeights =
          surveyWithUnweightedOption.addCategoryValueForOptionInQuestion({
            questionLabel: targetQuestionLabel,
            optionLabel: targetOptionLabel,
            valuesByCategory: {
              blue: 22,
            },
          }) as Survey;

        describe(`when the new weights do not conflict with the existing weights`, () => {
          it(`should add the new weights`, () => {
            const result =
              surveyWithExistingWeights.addCategoryValueForOptionInQuestion({
                questionLabel: targetQuestionLabel,
                optionLabel: targetOptionLabel,
                valuesByCategory: weightsToAdd,
              });

            expect(result).toBeInstanceOf(Survey);

            const updatedSurvey = result as Survey;

            const targetOption = updatedSurvey
              .get(targetQuestionLabel)
              ?.get(targetOptionLabel);

            expect(targetOption).toBeTruthy();

            expect(targetOption?.getValue('red')).toBe(50);
            expect(targetOption?.getValue('yellow')).toBe(25);
            expect(targetOption?.getValue('black')).toBe(0);
            expect(targetOption?.getValue('white')).toBe(0);
            expect(targetOption?.getValue('blue')).toBe(22);

            // unknown weights should still return 0
            expect(targetOption?.getValue('orange')).toBe(0);
          });
        });

        describe(`when the new weights conflict with the old weights (same name)`, () => {
          it(`should fail with the expected error`, () => {
            const result =
              surveyWithExistingWeights.addCategoryValueForOptionInQuestion({
                questionLabel: targetQuestionLabel,
                optionLabel: targetOptionLabel,
                valuesByCategory: {
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
        const result =
          surveyWithEmptyQuestion.addCategoryValueForOptionInQuestion({
            questionLabel: targetQuestionLabel,
            optionLabel: targetOptionLabel,
            valuesByCategory: {
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
      const result = emptySurvey.addCategoryValueForOptionInQuestion({
        questionLabel: targetQuestionLabel,
        optionLabel: targetOptionLabel,
        valuesByCategory: {
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
