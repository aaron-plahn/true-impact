import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import {
  SurveyResponseRecord,
  SurveyResponseRecordPersistenceDto,
} from '../survey-completion';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const targetSurvey = buildTestInstance<SurveyPersistenceDto>(Survey, {
  isPublished: true,
  topLevelQuestionLabels: ['1'],
  questions: {
    '1': {
      label: '1',
      prompt: 'Why are you taking this survey?',
      options: {
        a: {
          label: 'a',
          text: 'because I was voluntold',
        },
        b: {
          label: 'b',
          text: 'because I am bored',
        },
        c: {
          label: 'c',
          text: 'because I am genuinely interested, of course!',
        },
      },
    },
  },
}) as Survey;

/**
 * Note that our scenario tests will give us good coverage that many different
 * valid instances of a `SurveyResponseRecord` pass invariant validation. The
 * invalid cases are more important here.
 */
const validIncompleteInstance =
  buildTestInstance<SurveyResponseRecordPersistenceDto>(SurveyResponseRecord, {
    survey: targetSurvey.toPersistenceDto(),
  }) as SurveyResponseRecord;

describe(`SurveyCompletionRecord.validateInvariants`, () => {
  describe(`When all properties are specified and the instance is valid`, () => {
    it(`should return the valid instance`, () => {
      const result = validIncompleteInstance.validateInvariants();

      expect(result).toBeInstanceOf(SurveyResponseRecord);
    });
  });

  describe(`when a survey resposne record is invalid`, () => {
    describe(`when a survey response record has been marked as submitted **and** abandoned`, () => {
      const invalidInstanceBuildResult = buildTestInstance<
        SurveyResponseRecordPersistenceDto,
        SurveyResponseRecord
      >(SurveyResponseRecord, {
        survey: targetSurvey.toPersistenceDto(),
        hasBeenAbandoned: true,
        hasBeenSubmitted: true,
      });

      it(`should return the expected error`, () => {
        const result = invalidInstanceBuildResult.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(targetSurvey.name);
        expect(message).toContain(
          'cannot be marked as submitted and abandoned',
        );
      });
    });

    // TODO How are we dealing with optional questions
    describe(`when a survey response record has been marked as submitted but is missing required responses`, () => {
      it.todo(`should return the expected result`);
    });
  });
});
