import { buildTestInstance, TrueImpactError } from '../../libs';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const emptySurvey = buildTestInstance<SurveyPersistenceDto, Survey>(Survey, {
  firstQuestionLabel: undefined,
  questions: {},
});

const targetQuestionLabel = 'I';
const targetOptionLabel = 'a';
const targetFlagId = '333';

describe(`Survey.addFlagToOption`, () => {
  describe(`when the question exists`, () => {
    const surveyWithEmptyQuestion = emptySurvey.addFirstQuestion({
      label: targetQuestionLabel,
      prompt: 'I go to the gym',
    }) as Survey;

    describe(`when the option exists`, () => {
      const surveyWithTargetOption =
        surveyWithEmptyQuestion.addOptionToQuestion({
          questionLabel: targetQuestionLabel,
          optionLabel: targetOptionLabel,
          text: 'often',
        }) as Survey;

      describe(`when there are no existing flags`, () => {
        it(`should add the flag`, () => {
          const result = surveyWithTargetOption.addFlagToQuestionOption({
            questionLabel: targetQuestionLabel,
            optionLabel: targetOptionLabel,
            flagId: targetFlagId,
          });

          expect(result).toBeInstanceOf(Survey);

          const updatedSurvey = result as Survey;

          const updatedOption = updatedSurvey
            .get(targetQuestionLabel)
            ?.get(targetOptionLabel);

          expect(updatedOption?.hasFlag(targetFlagId)).toBe(true);

          expect(updatedOption?.getFlagIds()).toContain(targetFlagId);
        });
      });

      describe(`when there are existing flags`, () => {
        const existingFlagId = '555';

        const surveyWithExistingFlag =
          surveyWithTargetOption.addFlagToQuestionOption({
            questionLabel: targetQuestionLabel,
            optionLabel: targetOptionLabel,
            flagId: existingFlagId,
          }) as Survey;

        describe(`when the new flag has not yet been registered for this option`, () => {
          it(`should add the flag`, () => {
            const result = surveyWithExistingFlag.addFlagToQuestionOption({
              questionLabel: targetQuestionLabel,
              optionLabel: targetOptionLabel,
              flagId: targetFlagId,
            });

            expect(result).toBeInstanceOf(Survey);

            const updatedSurvey = result as Survey;

            const updatedOption = updatedSurvey
              .get(targetQuestionLabel)
              ?.get(targetOptionLabel);

            expect(updatedOption?.hasFlag(existingFlagId)).toBe(true);
            expect(updatedOption?.hasFlag(targetFlagId)).toBe(true);
            expect(updatedOption?.getFlagIds()).toHaveLength(2);
          });
        });

        describe(`when the new flag has already been registered for this option`, () => {
          it(`should return the expected error`, () => {
            const result = surveyWithExistingFlag.addFlagToQuestionOption({
              questionLabel: targetQuestionLabel,
              optionLabel: targetOptionLabel,
              flagId: existingFlagId,
            });

            expect(result).toBeInstanceOf(TrueImpactError);

            const message = (result as TrueImpactError).toString();

            expect(message).toContain(targetQuestionLabel);
            expect(message).toContain(targetOptionLabel);
            expect(message).toContain(existingFlagId);
            expect(message).toContain('already');
            expect(message).toContain('flag');
          });
        });
      });
    });

    describe(`when the option does not exist`, () => {
      it(`should return the expected error`, () => {
        const result = surveyWithEmptyQuestion.addFlagToQuestionOption({
          questionLabel: targetQuestionLabel,
          optionLabel: targetOptionLabel,
          flagId: targetFlagId,
        });

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(targetQuestionLabel);
        expect(message).toContain(targetOptionLabel);
        expect(message).toContain(targetFlagId);
        expect(message).toContain('no such option');
      });
    });
  });

  describe(`when the question does not exist`, () => {
    it(`should return the expected error`, () => {
      const result = emptySurvey.addFlagToQuestionOption({
        questionLabel: targetQuestionLabel,
        optionLabel: targetOptionLabel,
        flagId: targetFlagId,
      });

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(emptySurvey.name);
      expect(message).toContain(targetQuestionLabel);
      expect(message).toContain(targetOptionLabel);
      expect(message).toContain(targetFlagId);
      expect(message).toContain('no such question');
    });
  });
});
