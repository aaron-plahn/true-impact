import { buildTestInstance, DeepPartial, TrueImpactError } from '../../libs';
import { AddQuestionToSurvey } from './commands/add-question-to-survey.command';
import { SurveyQuestion } from './survey-question.entity';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const overrides: DeepPartial<SurveyPersistenceDto> = {
  questions: {},
};

// TODO Fix these funky type issues
const validEmptySurvey = buildTestInstance<SurveyPersistenceDto, Survey>(
  Survey,
  overrides,
);

const newQuestionLabel = 'i';

const addQuestionCommandPayload = buildTestInstance<
  AddQuestionToSurvey,
  AddQuestionToSurvey
>(AddQuestionToSurvey, {
  label: newQuestionLabel,
});

describe(`Survey.addQuestion`, () => {
  describe(`when the survey has no questions to start`, () => {
    describe(`when the request is valid`, () => {
      it(`should have a test`, () => {
        const result = validEmptySurvey.addQuestion(addQuestionCommandPayload);

        expect(result).not.toBeInstanceOf(TrueImpactError);

        expect((result as Survey).size()).toEqual(1);

        const question = (result as Survey).questions.get(
          newQuestionLabel,
        ) as SurveyQuestion;

        const { prompt } = question;

        expect(prompt).toEqual(addQuestionCommandPayload.prompt);

        expect(question.size()).toEqual(0);
      });
    });
  });

  describe(`when the survey has existing questions`, () => {
    const existingQuestion = buildTestInstance<
      SurveyPersistenceDto,
      SurveyQuestion
    >(SurveyQuestion, {
      label: 'a',
    });

    const survey = buildTestInstance<SurveyPersistenceDto, Survey>(Survey, {
      questions: {
        [existingQuestion.label]: existingQuestion,
      },
    });

    const addNewQuestionCommand = buildTestInstance<
      AddQuestionToSurvey,
      AddQuestionToSurvey
    >(AddQuestionToSurvey, {
      label: 'b',
    });

    describe(`when the request is valid`, () => {
      it(`should add the question to the survey`, () => {
        survey.addQuestion(addNewQuestionCommand);

        expect(survey.size()).toBe(2);
      });
    });

    describe(`when the request is invalid`, () => {
      // TODO do we want to prevent duplicate prompts across questions?
      describe(`when there is already a question with the given label`, () => {
        const invalidCommand = buildTestInstance<
          AddQuestionToSurvey,
          AddQuestionToSurvey
        >(AddQuestionToSurvey, {
          label: existingQuestion.label,
        });

        it(`should return the expected error`, () => {
          const result = survey.addQuestion(invalidCommand);

          expect(result).toBeInstanceOf(TrueImpactError);

          const message = (result as TrueImpactError).toString();

          expect(message).toContain('You cannot add question');
          expect(message).toContain(existingQuestion.label);
          expect(message).toContain('already a question');
          expect(message).toContain(survey.name);
        });
      });
    });
  });
});
