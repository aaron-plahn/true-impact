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

describe(`Survey.addFirstQuestion`, () => {
  describe(`when the survey has no questions to start`, () => {
    describe(`when the request is valid`, () => {
      it(`should have a test`, () => {
        const result = validEmptySurvey.addFirstQuestion(
          addQuestionCommandPayload,
        );

        expect(result).not.toBeInstanceOf(TrueImpactError);

        const updatedSurvey = result as Survey;

        expect(updatedSurvey.size()).toEqual(1);

        const question = updatedSurvey.getFirstQuestion() as SurveyQuestion;

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

    describe(`when the request is invalid`, () => {
      describe(`when the survey already has a first question`, () => {
        it(`should return the expected error`, () => {
          const result = survey.addFirstQuestion(addNewQuestionCommand);

          expect(result).toBeInstanceOf(TrueImpactError);

          const message = (result as TrueImpactError).toString();

          expect(message).toContain(`You cannot add`);

          expect(message).toContain(`first question`);

          expect(message).toContain(survey.name);

          expect(message).toContain(addNewQuestionCommand.label);

          expect(message).toContain('already has');
        });
      });
    });
  });
});
