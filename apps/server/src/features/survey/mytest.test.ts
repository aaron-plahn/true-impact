/* eslint-disable @typescript-eslint/no-floating-promises */
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { myHelper } from './my-helper';

/**
 * This is a placeholder for node native tests. We may want to use these
 * to write true end-to-end tests of the backend that execute against the build.
 */
describe('Does this work?', () => {
  it(`should work`, () => {
    assert.equal(myHelper(), 500);
  });
});
