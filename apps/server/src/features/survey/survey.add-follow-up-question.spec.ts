import { TrueImpactError } from '../../libs';
import { Survey } from './survey.aggregate-root';

describe(`Survey.addFollowUpQuestion`, () => {
  const emptySurvey = Survey.buildEmpty({ name: 'test survey' }) as Survey;

  const targetQuestionLabel = 'V';

  const targetOptionLabel = 'c';

  const followUpQuestionLabel = 'V.a';

  const followUpQuestionPrompt = "I don't go outside ever because:";

  describe(`when the target question exists`, () => {
    const surveyWithEmptyQuestion = emptySurvey.addTopLevelQuestion({
      label: targetQuestionLabel,
      prompt: 'I am the first test question and I have no options',
    }) as Survey;

    describe(`when the target option exists`, () => {
      const surveyWithOption = surveyWithEmptyQuestion.addOptionToQuestion({
        questionLabel: targetQuestionLabel,
        optionLabel: targetOptionLabel,
        text: 'First choice- just waiting for a follow up question!',
      }) as Survey;

      describe(`when the target question does not yet have a follow-up question`, () => {
        it(`should add the follow-up question`, () => {
          const result = surveyWithOption.addFollowUpQuestion({
            questionLabel: targetQuestionLabel,
            optionLabel: targetOptionLabel,
            followUpQuestion: {
              label: followUpQuestionLabel,
              prompt: followUpQuestionPrompt,
            },
          });

          expect(result).toBeInstanceOf(Survey);

          const updatedSurvey = result as Survey;

          const followUpQuestionSearchResult = updatedSurvey.next(
            targetQuestionLabel,
            targetOptionLabel,
          );

          //   Should this take an object as the param? It's easy to cross wires on the labels.
          expect(followUpQuestionSearchResult?.label).toBe(
            followUpQuestionLabel,
          );

          expect(followUpQuestionSearchResult?.prompt).toBe(
            followUpQuestionPrompt,
          );
        });
      });

      /**
       * We may eventually want to allow for multiple (flat, top-level) follow up questions.
       */
      describe(`when the target question already has a follow-up question`, () => {
        const surveyWithFollowUpQuestionForOptionAlready =
          surveyWithOption.addFollowUpQuestion({
            questionLabel: targetQuestionLabel,
            optionLabel: targetOptionLabel,
            followUpQuestion: {
              label: 'ABC',
              prompt:
                'Oops- I am a redundant follow-up question for this option',
            },
          }) as Survey;

        it('should fail with the expected error', () => {
          const result =
            surveyWithFollowUpQuestionForOptionAlready.addFollowUpQuestion({
              questionLabel: targetQuestionLabel,
              optionLabel: targetOptionLabel,
              followUpQuestion: {
                label: followUpQuestionLabel,
                prompt: followUpQuestionPrompt,
              },
            });

          expect(result).toBeInstanceOf(TrueImpactError);

          const message = (result as TrueImpactError).toString();

          expect(message).toContain(targetQuestionLabel);
          expect(message).toContain(targetOptionLabel);
          expect(message).toContain('second follow-up question');
          expect(message).toContain('not currently supported');
        });
      });
    });

    describe(`when the target option does not exist`, () => {
      it(`should return the expected error`, () => {
        const result = surveyWithEmptyQuestion.addFollowUpQuestion({
          questionLabel: targetQuestionLabel,
          optionLabel: targetOptionLabel,
          followUpQuestion: {
            label: followUpQuestionLabel,
            prompt: followUpQuestionPrompt,
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
      const result = emptySurvey.addFollowUpQuestion({
        questionLabel: targetQuestionLabel,
        optionLabel: targetOptionLabel,
        followUpQuestion: {
          prompt: followUpQuestionPrompt,
          label: followUpQuestionLabel,
        },
      });

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain('follow-up');
      expect(message).toContain(targetQuestionLabel);
      expect(message).toContain(targetOptionLabel);
      expect(message).toContain('no such question');
    });
  });
});
