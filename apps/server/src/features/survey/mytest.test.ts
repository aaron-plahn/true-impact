/* eslint-disable @typescript-eslint/no-floating-promises */
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { CreateSurvey } from './commands/create-survey.command';
import { Survey } from './survey.aggregate-root';

describe('Does this work?', () => {
  it(`should work`, () => {
    const result = Survey.fromCreateSurveyCommand({} as CreateSurvey);
    assert.equal(result, 'oops');
  });
});
