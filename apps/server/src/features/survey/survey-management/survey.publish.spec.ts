import { TrueImpactError } from '../../../libs/data-types';
import { Survey } from './survey.aggregate-root';

const emptySurvey = Survey.buildEmpty({
  name: 'test survey',
  id: '123',
}) as Survey;

const targetQuestionLabel = 'i';

const surveyWithEmptyQuestion = emptySurvey.addTopLevelQuestion({
  label: targetQuestionLabel,
  prompt: 'I exercise',
}) as Survey;

const surveyWithOneOption = surveyWithEmptyQuestion.addOptionToQuestion({
  questionLabel: targetQuestionLabel,
  optionLabel: 'a',
  text: 'I am your first option',
}) as Survey;

const surveyThatIsReadyToBeFinalized = surveyWithOneOption.addOptionToQuestion({
  questionLabel: targetQuestionLabel,
  optionLabel: 'b',
  text: 'I give you a second option',
}) as Survey;

describe(`Survey.finalize`, () => {
  describe(`when the survey is not yet finalization`, () => {
    describe(`when the survey meets all finalization requirements`, () => {
      const result = surveyThatIsReadyToBeFinalized.finalize();

      it(`should update the publication status`, () => {
        expect(result).toBeInstanceOf(Survey);

        const updatedSurvey = result as Survey;

        expect(updatedSurvey.isFinal).toBe(true);
      });

      // note that we have scenario tests to ensure that edits to the survey are locked upon publication
    });

    describe(`when the survey fails one of the publication status checks`, () => {
      describe(`when the survey has no questions`, () => {
        it(`should return the expected errors`, () => {
          const result = emptySurvey.finalize();

          expect(result).toBeInstanceOf(TrueImpactError);

          const message = (result as TrueImpactError).toString();

          // Do we want this?
          //   expect(message).toContain(emptySurvey.name);
          expect(message).toContain('at least one question');
          expect(message).toContain('to be finalized');
        });
      });

      describe(`when one of the questions has less than 2 options`, () => {
        describe(`when one of the questions has no options`, () => {
          it(`should return the expected error`, () => {
            const result = surveyWithEmptyQuestion.finalize();

            expect(result).toBeInstanceOf(TrueImpactError);

            const message = (result as TrueImpactError).toString();

            //   expect(message).toContain(emptySurvey.name);
            expect(message).toContain(targetQuestionLabel);
            expect(message).toContain('at least 2 options');
          });
        });

        describe(`when one of the questions has only 1 option`, () => {
          it(`should return the expected error`, () => {
            const result = surveyWithOneOption.finalize();

            expect(result).toBeInstanceOf(TrueImpactError);

            const message = (result as TrueImpactError).toString();

            //   expect(message).toContain(emptySurvey.name);
            expect(message).toContain(targetQuestionLabel);
            expect(message).toContain('at least 2 options');
          });
        });
      });
    });
  });

  describe(`when the survey has already been finalized`, () => {
    const finalizedSurvey = surveyThatIsReadyToBeFinalized.finalize() as Survey;

    it(`should return the expected error`, () => {
      const result = finalizedSurvey.finalize();

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(finalizedSurvey.name);
      expect(message).toContain(`has been finalized`);
    });
  });
});
