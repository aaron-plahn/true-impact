import { SurveyResponseRecord } from '.';
import {
  buildTestInstance,
  TrueImpactError,
} from '../../../../libs/data-types';
import { assertTextMatchesAll } from '../../../../libs/test-utils';
import { Survey } from '../../survey-management';

const submissionTimestamp = 1787693484530;

/**
 * TODO Why are there two separate tests for this?
 */
describe(`SurveyResponseRecord.validateInvariants`, () => {
  describe(`when the survey response record is valid`, () => {
    it.todo(`should return the expected response`);
  });

  const validSurvey = buildTestInstance(
    Survey,
    {
      isFinal: true,
      topLevelQuestionLabels: ['1'],
      questions: {
        '1': {
          prompt: 'Do you like my survey?',
          options: {
            a: {
              text: 'yes',
            },
            b: {
              text: 'no',
            },
          },
        },
      },
    },
    { shouldValidate: false },
  );

  describe(`when the survey response record is invalid`, () => {
    // TODO there are other complex invariant rules that would be nice to test at this level
    // currently they are tested only at the server e2e level

    describe(`when it has been marked as submitted and cancelled`, () => {
      it(`should return the expected error`, () => {
        const invalidInstance = buildTestInstance(SurveyResponseRecord, {
          survey: validSurvey.toPersistenceDto(),
          submissionTimestamp,
          hasBeenCancelled: true,
          hasBeenAbandoned: false,
          responses: [
            {
              questionLabel: '1',
              optionLabel: 'a',
            },
          ],
        });

        const result = invalidInstance.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        assertTextMatchesAll(
          message,
          validSurvey.name,
          'cannot be marked as submitted and cancelled',
        );
      });
    });

    describe(`when it has been marked as submitted and abandoned`, () => {
      it(`should return the expected error`, () => {
        const invalidInstance = buildTestInstance(SurveyResponseRecord, {
          survey: validSurvey.toPersistenceDto(),
          submissionTimestamp,
          hasBeenCancelled: false,
          hasBeenAbandoned: true,
          responses: [
            {
              questionLabel: '1',
              optionLabel: 'a',
            },
          ],
        });

        const result = invalidInstance.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        assertTextMatchesAll(
          message,
          validSurvey.name,
          'cannot be marked as submitted and abandoned',
        );
      });
    });

    describe(`when it has been marked as submitted, abandoned, and cancelled`, () => {
      it(`should return the expected error`, () => {
        const invalidInstance = buildTestInstance(SurveyResponseRecord, {
          survey: validSurvey.toPersistenceDto(),
          submissionTimestamp,
          hasBeenCancelled: true,
          hasBeenAbandoned: true,
          responses: [
            {
              questionLabel: '1',
              optionLabel: 'a',
            },
          ],
        });

        const result = invalidInstance.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        assertTextMatchesAll(
          message,
          validSurvey.name,
          'cannot be marked as',
          'submitted and abandoned',
          'submitted and cancelled',
          'cancelled and abandoned',
        );
      });
    });
  });
});
