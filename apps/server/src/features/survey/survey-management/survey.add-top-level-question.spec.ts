import { TrueImpactError } from '../../../libs/data-types';
import { SurveyQuestion } from '../survey-management/survey-question.entity';
import { Survey } from './survey.aggregate-root';

const validEmptySurvey = Survey.buildEmpty({ name: 'test survey' }) as Survey;

const firstQuestionLabel = 'i';

const firstQuestionPrompt = 'I take frequent breaks';

describe(`Survey.addTopLevelQuestion`, () => {
  describe(`when the survey has no questions to start`, () => {
    describe(`when the request is valid`, () => {
      it(`should have a test`, () => {
        const result = validEmptySurvey.addTopLevelQuestion({
          label: firstQuestionLabel,
          prompt: firstQuestionPrompt,
        });

        expect(result).not.toBeInstanceOf(TrueImpactError);

        const updatedSurvey = result as Survey;

        expect(updatedSurvey.size()).toEqual(1);

        const question = updatedSurvey.getFirstQuestion() as SurveyQuestion;

        const { prompt } = question;

        expect(prompt).toEqual(firstQuestionPrompt);

        expect(question.size()).toEqual(0);
      });
    });
  });

  describe(`when the survey has existing questions`, () => {
    const survey = validEmptySurvey.addTopLevelQuestion({
      label: firstQuestionLabel,
      prompt: firstQuestionPrompt,
    }) as Survey;

    describe(`when the new question has a unique label`, () => {
      const secondQuestionLabel = 'b'; // !== 'a'
      const secondQuestionPrompt = 'I follow the 20-20-20 rule';

      it(`should add the new question`, () => {
        const result = survey.addTopLevelQuestion({
          label: secondQuestionLabel,
          prompt: secondQuestionPrompt,
        });

        expect(result).toBeInstanceOf(Survey);

        const updatedSurvey = result as Survey;

        expect(updatedSurvey.size()).toBe(2);

        expect(updatedSurvey.get(secondQuestionLabel)?.prompt).toBe(
          secondQuestionPrompt,
        );
      });
    });

    describe(`when the request is invalid`, () => {
      describe(`when the survey already has a question with the given label`, () => {
        it(`should return the expected error`, () => {
          const result = survey.addTopLevelQuestion({
            label: firstQuestionLabel,
            prompt: 'Oops there is already a question with this label',
          });

          expect(result).toBeInstanceOf(TrueImpactError);

          const message = (result as TrueImpactError).toString();

          expect(message).toContain(`You cannot add`);

          expect(message).toContain(survey.name);

          expect(message).toContain(firstQuestionLabel);

          expect(message).toContain('already');
          expect(message).toContain('this label');
        });
      });
    });
  });
});
