import { CLIENT_AGGREGATE_TYPE } from '../../../features/clients/client.composite-identifier';
import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { SurveyResponseRecord } from '../survey-completion';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

const topLevelQuestionLabels = ['1'];

const questions = {
  '1': {
    label: '1',
    prompt: 'Did you enjoy this survey?',
    options: {
      a: {
        label: 'a',
        text: 'Yes',
      },
      b: {
        label: 'b',
        text: 'No',
      },
      c: {
        label: 'c',
        text: 'Maybe So',
      },
    },
  },
};

const publishedSurvey = buildTestInstance<SurveyPersistenceDto>(Survey, {
  topLevelQuestionLabels,
  isPublished: true,
  questions,
}) as Survey;

const clientCompositeIdentifier = {
  type: CLIENT_AGGREGATE_TYPE,
  id: '1234',
};

describe(`SurveyResponseRecord.begin`, () => {
  describe(`when the request is valid`, () => {
    it(`should return an empty response record with the associated survey`, () => {
      const result = SurveyResponseRecord.begin({
        survey: publishedSurvey,
        hashedAccessCode: 'DUMMY-ACCESS-CODE',
      });

      expect(result).toBeInstanceOf(SurveyResponseRecord);

      const responseRecord = result as SurveyResponseRecord;

      expect(responseRecord.isComplete()).toBe(false);
      expect(responseRecord.hasBeenAbandoned).toBe(false);
      expect(responseRecord.hasBeenSubmitted).toBe(false);
    });
  });

  describe(`when the request is invalid`, () => {
    describe(`when the survey has not been published`, () => {
      const unpublishedSurvey = buildTestInstance<SurveyPersistenceDto>(
        Survey,
        {
          topLevelQuestionLabels,
          questions,
          isPublished: false,
        },
      ) as Survey;

      it(`should return the expected error`, () => {
        const result = SurveyResponseRecord.begin({
          survey: unpublishedSurvey,
          hashedAccessCode: 'DUMMY-ACCESS-CODE',
          participantCompositeIdentifier: clientCompositeIdentifier,
        });

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(unpublishedSurvey.name);
        expect(message).toContain(`cannot begin`);
        expect(message).toContain(`not been published`);
      });
    });

    describe(`when an invalid participant type is provided`, () => {
      const invalidParticipantType = 'ROBOT';

      it(`should return the expected error`, () => {
        const result = SurveyResponseRecord.begin({
          survey: publishedSurvey,
          hashedAccessCode: 'DUMMY-ACCESS-CODE-123',
          participantCompositeIdentifier: {
            type: invalidParticipantType,
            id: '555',
          },
        });

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        expect(message).toContain(publishedSurvey.name);
        expect(message).toContain('cannot begin');
        expect(message).toContain('invalid participant type');
        expect(message).toContain(invalidParticipantType);
      });
    });
  });
});
