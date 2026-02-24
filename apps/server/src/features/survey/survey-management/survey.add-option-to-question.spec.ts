import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { SurveyQuestion } from '../survey-management/survey-question.entity';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const surveyId = '123';

const emptySurvey = buildTestInstance<SurveyPersistenceDto, Survey>(Survey, {
  id: surveyId,
  questions: {},
});

const questionLabel = '1';

const optionLabel = 'a';

const optionText = 'always';

describe(`Survey.addOptionToQuestion`, () => {
  describe(`when the question exists`, () => {
    const surveyWithOneQuestion = emptySurvey.addTopLevelQuestion({
      label: questionLabel,
      // We don't need this here
      prompt: 'Test prompt for first question',
    }) as Survey;

    describe(`When the target is the first question in a survey`, () => {
      describe(`when it does not yet have any options`, () => {
        it('should add a first option', () => {
          const result = surveyWithOneQuestion.addOptionToQuestion({
            questionLabel,
            optionLabel,
            text: optionText,
          });

          expect(result).toBeInstanceOf(Survey);

          const updatedSurvey = result as Survey;

          expect(updatedSurvey.size()).toBe(1);

          expect(updatedSurvey.getFirstQuestion()?.size()).toBe(1);

          // TODO check options in detail
        });
      });

      describe(`when the survey already has options`, () => {
        // TODO Update methods should return a `ResultOrError` that we can `.map` over.
        const surveyWithQuestionAndOneOption =
          surveyWithOneQuestion.addOptionToQuestion({
            questionLabel,
            optionLabel: 'existing',
            text: 'text for the existing option',
          }) as Survey;

        describe(`when the request is valid`, () => {
          it(`should add the option to the given question`, () => {
            const result = surveyWithQuestionAndOneOption.addOptionToQuestion({
              questionLabel,
              optionLabel,
              text: optionText,
            });

            expect(result).not.toBeInstanceOf(TrueImpactError);

            const updatedSurvey = result as Survey;

            expect(updatedSurvey.size()).toBe(1); // still

            expect(
              (updatedSurvey.getFirstQuestion() as SurveyQuestion).size(),
            ).toBe(2);
          });
        });

        describe(`when the request is invalid`, () => {
          const existingOptionText = 'Sometimes (test option text)';

          const existingSurvey = buildTestInstance<
            SurveyPersistenceDto,
            Survey
          >(Survey, {
            questions: {
              [questionLabel]: {
                options: {
                  [optionLabel]: {
                    label: optionLabel,
                    text: existingOptionText,
                  },
                },
              },
            },
          });

          describe(`when there is already an option with the given label`, () => {
            const invalidRequest = {
              questionLabel,
              optionLabel,
              text: 'text for this option',
            };
            it(`should return the expected error`, () => {
              const result = existingSurvey.addOptionToQuestion(invalidRequest);

              expect(result).toBeInstanceOf(TrueImpactError);

              const message = (result as TrueImpactError).toString();

              expect(message).toContain('already an option');
              expect(message).toContain(optionLabel);
              expect(message).toContain(questionLabel);
            });
          });

          describe(`when there is already an option with the given text`, () => {
            it(`should return the expected error`, () => {
              const labelForOptionWithRepeatedText = 'XII';

              const userRequest = {
                questionLabel,
                optionLabel: labelForOptionWithRepeatedText,
                text: existingOptionText,
              };

              const result = existingSurvey.addOptionToQuestion(userRequest);

              expect(result).toBeInstanceOf(TrueImpactError);

              const message = (result as TrueImpactError).toString();

              expect(message).toContain('already has the text');
              expect(message).toContain(labelForOptionWithRepeatedText);
              expect(message).toContain(optionLabel);
              expect(message).toContain(questionLabel);
              expect(message).toContain(existingOptionText);
            });
          });
        });
      });
    });
  });

  describe(`when the question does not exist`, () => {
    it(`should return the expected error`, () => {
      const result = emptySurvey.addOptionToQuestion({
        questionLabel,
        optionLabel,
        text: 'There is no question for me to call home :(',
      });

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(`no question`);

      expect(message).toContain(questionLabel);

      expect(message).toContain(optionLabel);

      expect(message).toContain(emptySurvey.name);
    });
  });
});
