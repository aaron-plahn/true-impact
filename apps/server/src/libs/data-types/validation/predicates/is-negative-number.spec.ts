import { isNegativeNumber } from './is-negative-number';
import { buildTestCaseRunner } from './utils';

const positiveTestCase = buildTestCaseRunner(true, isNegativeNumber);

const negativeTestCase = buildTestCaseRunner(false, isNegativeNumber);

describe(`isNegativeNumber`, () => {
  describe(`when the input is a negative number`, () => {
    positiveTestCase(-123);

    positiveTestCase(-5.5);

    positiveTestCase(-Infinity);
  });

  describe(`when the input is not a negative number`, () => {
    negativeTestCase(1);

    negativeTestCase(0);

    negativeTestCase(-0, { description: '-0' });
  });
});
