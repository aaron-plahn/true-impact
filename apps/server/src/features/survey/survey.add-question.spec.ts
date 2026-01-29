import { buildTestInstance, DeepPartial, TrueImpactError } from '../../libs';
import { AddQuestionToSurvey } from './commands/add-question-to-survey.command';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const overrides: DeepPartial<SurveyPersistenceDto> = {
  questions: {},
};

// TODO Fix these funky type issues
const validEmptySurvey = buildTestInstance<SurveyPersistenceDto, Survey>(
  Survey,
  overrides,
) as Survey;

const newQuestionLabel = 'i';

const addQuestionCommandPayload = buildTestInstance<
  AddQuestionToSurvey,
  AddQuestionToSurvey
>(AddQuestionToSurvey, {
  label: newQuestionLabel,
}) as AddQuestionToSurvey;

describe(`Survey.addQuestion`, () => {
  describe(`when the survey has no questions to start`, () => {
    describe(`when the request is valid`, () => {
      it(`should have a test`, () => {
        const result = validEmptySurvey.addQuestion(addQuestionCommandPayload);

        expect(result).not.toBeInstanceOf(TrueImpactError);

        expect((result as Survey).questions).toHaveLength(1);

        expect(
          (result as Survey).questions
            .get(newQuestionLabel)
            ?.toPersistenceDto(),
        ).toEqual({
          foo: 5,
        });
      });
    });
  });

  describe(`when the survey has existing questions`, () => {
    describe(`when the request is valid`, () => {
      it.todo(`should add the question to the survey`);
    });

    describe(`when the request is invalid`, () => {
      // TODO do we want to prevent duplicate prompts across questions?
      describe(`when there is already a question with the given label`, () => {
        it.todo(`should return the expected error`);
      });
    });
  });
});
