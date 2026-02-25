import { isPositiveNumber } from './is-positive-number';
import { buildTestCaseRunner } from './utils';

const positiveTestCase = buildTestCaseRunner(true, isPositiveNumber);

const negativeTestCase = buildTestCaseRunner(false, isPositiveNumber);

describe(`isPositiveNumber`, () => {
  describe(`when the input is a positive number`, () => {
    positiveTestCase(100.123);

    positiveTestCase(1);

    positiveTestCase(Infinity);

    positiveTestCase(Math.PI);
  });

  describe(`when the input is not a positive number`, () => {
    negativeTestCase(0);

    negativeTestCase(-0, { description: 'negative 0' });

    negativeTestCase('1');

    negativeTestCase(-Infinity);

    negativeTestCase(Number.NaN);

    negativeTestCase(
      { value: 2.0 },
      { description: 'object with positive-number valued property' },
    );

    negativeTestCase(
      function () {
        return 123;
      },
      { description: 'function that returns a positive number' },
    );

    negativeTestCase(() => 5.555, {
      description: 'arrow function that returns a positive number',
    });
  });
});
