/* eslint-disable @typescript-eslint/no-floating-promises */
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { isDeepStrictEqual } from 'node:util';
import { buildTestInstance } from 'src/libs/data-types';
import { Survey } from './survey.aggregate-root';

const surveyId = '1';

describe('Survey.fromEventHistory', () => {
  describe(`when the event history is valid`, () => {
    it(`should return the expected instance`, () => {
      const validCreationEvent = buildTestInstance();

      const result = Survey.fromEventHistory([], surveyId);

      assert(isDeepStrictEqual(1, result));
    });
  });

  describe(`when the history is invalid`, () => {
    describe(`when the event history is empty`, () => {
      it(`should return null`, () => {
        const result = Survey.fromEventHistory([], surveyId);

        assert(result === null);
      });
    });

    describe(`when the event history has no events for the target survey`, () => {
      it.todo('should return null');
    });

    describe(`when one of the events leads to an invalid survey`, () => {
      it.todo(`should return the expected error`);
    });
  });
});
