import { buildTestInstance, TrueImpactError } from '../../libs';
import { AddOptionToSurveyQuestion } from './commands/add-option-to-survey-question.command';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const emptySurvey = buildTestInstance<SurveyPersistenceDto, Survey>(Survey, {
  questions: {},
});

const questionLabel = '1';

const optionLabel = 'a';

const addOptionCommand = buildTestInstance<
  AddOptionToSurveyQuestion,
  AddOptionToSurveyQuestion
>(AddOptionToSurveyQuestion, {
  questionLabel,
  optionLabel,
});

describe(`Survey.addOptionToQuestion`, () => {
  describe(`when the question exists`, () => {
    describe(`when it does not yet have any options`, () => {
      it.todo('should add a first option');
    });

    describe(`when the survey already has options`, () => {
      describe(`when the request is valid`, () => {
        it.todo(`should add the option to the given question`);
      });

      describe(`when the request is invalid`, () => {
        describe(`when there is already an option with the given label`, () => {
          const existingSurvey = buildTestInstance<
            SurveyPersistenceDto,
            Survey
          >(Survey, {
            questions: {
              [questionLabel]: {
                options: {
                  [optionLabel]: {
                    label: optionLabel,
                  },
                },
              },
            },
          });

          const invalidRequest = buildTestInstance<
            AddOptionToSurveyQuestion,
            AddOptionToSurveyQuestion
          >(AddOptionToSurveyQuestion, {
            optionLabel: optionLabel,
            questionLabel: questionLabel,
          });

          it(`should return the expected error`, () => {
            const result = existingSurvey.addOptionToQuestion(invalidRequest);

            expect(result).toBeInstanceOf(TrueImpactError);

            const message = (result as TrueImpactError).toString();

            expect(message).toContain('already an option');
            expect(message).toContain(optionLabel);
            expect(message).toContain(questionLabel);
          });
        });
      });
    });
  });

  describe(`when the question does not exist`, () => {
    it(`should return the expected error`, () => {
      const result = emptySurvey.addOptionToQuestion(addOptionCommand);

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(`no question`);

      expect(message).toContain(questionLabel);

      expect(message).toContain(optionLabel);

      expect(message).toContain(emptySurvey.name);
    });
  });
});
