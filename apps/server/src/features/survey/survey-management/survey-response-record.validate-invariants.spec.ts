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
      prompt: 'Why are you taking this survey?',
      options: {
        a: {
          text: 'because I was voluntold',
        },
        b: {
          text: 'because I am bored',
        },
        c: {
          text: 'because I am genuinely interested, of course!',
        },
      },
    },
  },
}) as Survey;

const complexSurvey = buildTestInstance(Survey, {
  isPublished: true,
  topLevelQuestionLabels: ['1', '4'],
  questions: {
    '1': {
      prompt: 'What is your favorite weather?',
      options: {
        i: {
          text: 'rain',
        },
        ii: {
          text: 'snow',
          nextQuestionLabel: '2',
        },
        iii: {
          text: 'sun',
          // Do we prevent loops?
          nextQuestionLabel: '3',
        },
      },
    },
    '2': {
      prompt: 'Were you born in the winter?',
      options: {
        i: {
          text: 'yes',
        },
        ii: {
          text: 'no',
        },
      },
    },
    '3': {
      prompt: 'Were you born in the summer?',
      options: {
        i: {
          text: 'yes',
        },
        ii: {
          text: 'no',
        },
      },
    },
    '4': {
      prompt: 'Who is your favorite author?',
      options: {
        i: {
          text: 'Bookie McAuthor',
        },
        ii: {
          text: 'Susie Makesitup',
        },
        iii: {
          text: 'Mr. Reeraiter',
        },
      },
    },
  },
});

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

      expect(result).not.toBeInstanceOf(TrueImpactError);
    });
  });

  describe(`when a survey resposne record is invalid`, () => {
    describe(`when a survey response record has been marked as submitted **and** abandoned`, () => {
      it(`should return the expected error`, () => {
        const invalidInstanceBuildResult = buildTestInstance(
          SurveyResponseRecord,
          {
            survey: targetSurvey.toPersistenceDto(),
            hasBeenAbandoned: true,
            hasBeenSubmitted: true,
          },
        );

        const result = invalidInstanceBuildResult.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(targetSurvey.name);
        expect(message).toContain(
          'cannot be marked as submitted and abandoned',
        );
      });
    });

    describe(`when a survey response record has been marked as submitted but is missing required response to an optional question`, () => {
      it(`should return the expected error`, () => {
        const invalidInstance = buildTestInstance(SurveyResponseRecord, {
          hasBeenSubmitted: true,
          hasBeenAbandoned: false,
          responses: [
            {
              questionLabel: '1',
              optionLabel: 'ii',
            },
            {
              questionLabel: '4',
              optionLabel: 'iii',
            },
          ],
          survey: complexSurvey.toPersistenceDto(),
        });

        const result = invalidInstance.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(complexSurvey.name);
        expect(message).toContain(`missing an answer for required question`);
        expect(message).toContain('2');
      });
    });

    describe(`When a survey response record has been marked as submitted but it is missing a required response to the last question (still in progress)`, () => {
      it(`should return the expected error`, () => {
        const invalidInstance = buildTestInstance(SurveyResponseRecord, {
          hasBeenAbandoned: false,
          hasBeenSubmitted: true,
          survey: complexSurvey.toPersistenceDto(),
          responses: [
            {
              questionLabel: '1',
              optionLabel: 'ii',
            },
            {
              questionLabel: '2',
              optionLabel: 'i',
            },
            // missing an answer for question '4'
          ],
        });

        const result = invalidInstance.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(complexSurvey.name);
        expect(message).toContain(`not complete`);
      });
    });
  });
});
