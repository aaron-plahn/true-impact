/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SurveyResponseRecord } from '.';
import { BaseEvent } from '../../../../libs/cqrs-es/event-repository.interface';
import {
  buildTestInstance,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SurveyPersistenceDto } from '../../survey-management';
import {
  SurveyCompletionAbandoned,
  SurveyCompletionCancelled,
  SurveySubmitted,
} from '../commands';
import { SurveyQuestionAnswered } from '../commands/answer-survey-question/survey-question-answered.event';
import { SurveyBegan } from '../commands/begin-survey/survey-began.event';

const surveyResponseRecordId = '54567';

const targetSurvey: SurveyPersistenceDto = {
  id: '99',
  name: 'My Survey',
  questions: {
    '1': {
      prompt: 'What do you think of question 1?',
      options: {
        a: {
          text: 'I love it.',
          // TODO omit these for the response record
          flagIds: [],
        },
        b: {
          text: 'It is ok.',
          flagIds: [],
        },
        c: {
          text: 'I hate it.',
          flagIds: [],
        },
      },
    },
  },
  topLevelQuestionLabels: ['1'],
  revision: 0,
  isFinal: false,
  analyzers: {},
  accessTokensByHash: {},
};

const surveyBegan = buildTestInstance(SurveyBegan, {
  payload: {
    aggregateCompositeIdentifier: {
      id: surveyResponseRecordId,
    },
    survey: targetSurvey,
  },
});

const surveyQuestionAnswered = buildTestInstance(SurveyQuestionAnswered, {
  payload: {
    aggregateCompositeIdentifier: {
      id: surveyResponseRecordId,
    },
    questionLabel: '1',
    chosenOptionLabel: 'c',
  },
});

const surveySubmitted = buildTestInstance(SurveySubmitted, {
  payload: {
    aggregateCompositeIdentifier: {
      id: surveyResponseRecordId,
    },
  },
});

const surveyAbandoned = buildTestInstance(SurveyCompletionAbandoned, {
  payload: {
    aggregateCompositeIdentifier: {
      id: surveyResponseRecordId,
    },
  },
});

const surveyCancelled = buildTestInstance(SurveyCompletionCancelled, {
  payload: {
    aggregateCompositeIdentifier: {
      id: surveyResponseRecordId,
    },
  },
});

describe(`SurveyResponseRecord.fromEventHistory`, () => {
  describe(`when the event history starts with a valid creation event`, () => {
    describe(`when there is only a creation event`, () => {
      it(`should build the expected instance`, () => {
        const result = SurveyResponseRecord.fromEventHistory([surveyBegan]);

        assert.strictEqual(result instanceof SurveyResponseRecord, true);

        const record = result as SurveyResponseRecord;

        assert.strictEqual(
          record.getId(),
          surveyBegan.payload.aggregateCompositeIdentifier.id,
        );

        assert.strictEqual(record.getName(), surveyBegan.payload.survey.name);
      });
    });

    describe(`when a first question has been answered`, () => {
      const result = SurveyResponseRecord.fromEventHistory([
        surveyBegan,
        surveyQuestionAnswered,
      ]);

      assert.strictEqual(result instanceof SurveyResponseRecord, true);

      const record = result as SurveyResponseRecord;

      assert.strictEqual(record.hasBeenAbandoned, false);

      assert.strictEqual(record.hasBeenCancelled, false);

      assert.strictEqual(record.hasBeenSubmitted, false);

      assert.deepStrictEqual(
        record.getAggregateCompositeIdentifier(),
        surveyQuestionAnswered.payload.aggregateCompositeIdentifier,
      );

      assert.strictEqual(record.responses.length, 1);

      const questionResponse = record.responses[0];

      assert.strictEqual(
        questionResponse.questionLabel,
        surveyQuestionAnswered.payload.questionLabel,
      );

      assert.strictEqual(
        questionResponse.optionLabel,
        surveyQuestionAnswered.payload.chosenOptionLabel,
      );
    });

    describe(`when the survey has been submitted`, () => {
      it(`should return a submitted survey`, () => {
        const result = SurveyResponseRecord.fromEventHistory([
          surveyBegan,
          surveyQuestionAnswered,
          surveySubmitted,
        ]);

        assert.strictEqual(result instanceof SurveyResponseRecord, true);

        const record = result as SurveyResponseRecord;

        assert.strictEqual(record.hasBeenSubmitted, true);

        assert.strictEqual(record.hasBeenAbandoned, false);

        assert.strictEqual(record.hasBeenCancelled, false);
      });
    });

    describe(`when the survey attempt has been abandoned by the participant`, () => {
      it(`should mark the survey as abandoned`, () => {
        const result = SurveyResponseRecord.fromEventHistory([
          surveyBegan,
          surveyQuestionAnswered,
          surveyAbandoned,
        ]) as SurveyResponseRecord;

        assert.strictEqual(result instanceof SurveyResponseRecord, true);

        assert.strictEqual(result.hasBeenAbandoned, true);
        assert.strictEqual(result.hasBeenCancelled, false);
        assert.strictEqual(result.hasBeenSubmitted, false);
      });
    });

    describe(`when the survey attempt has been cancelled`, () => {
      it(`should mark the attempt as cancelled`, () => {
        const result = SurveyResponseRecord.fromEventHistory([
          surveyBegan,
          surveyQuestionAnswered,
          surveyCancelled,
        ]) as SurveyResponseRecord;

        assert.strictEqual(result instanceof SurveyResponseRecord, true);

        assert.strictEqual(result.hasBeenCancelled, true);

        assert.strictEqual(result.hasBeenAbandoned, false);

        assert.strictEqual(result.hasBeenSubmitted, false);
      });
    });
  });

  describe(`when the event history is empty`, () => {
    it(`should return null`, () => {
      const result = SurveyResponseRecord.fromEventHistory([]);

      assert.strictEqual(result, null);
    });
  });

  describe(`when the event history has a creation event of an unknown type`, () => {
    it(`should return the expected error`, () => {
      const bogusEvent: BaseEvent = {
        type: 'WIDGET_BLUDGENNED',
        streamId: 'widget/1',
        payload: {
          aggregateCompositeIdentifier: {
            type: 'widget',
            id: '1',
          },
        },
        // TODO check meta
        // TODO should the model be aware of the meta?
        metadata: {},
        revision: 5,
      };

      const result = SurveyResponseRecord.fromEventHistory([bogusEvent]);

      assert.strictEqual(result instanceof Error, true);

      const message = (result as TrueImpactError).toString();

      ['invalid creation event', 'SURVEY_BEGAN', bogusEvent.type].forEach(
        (pattern) => {
          assert.strictEqual(
            message.includes(pattern),
            true,
            `Expected to find the pattern [${pattern}] in text [${message}], but did not.`,
          );
        },
      );
    });
  });
});
