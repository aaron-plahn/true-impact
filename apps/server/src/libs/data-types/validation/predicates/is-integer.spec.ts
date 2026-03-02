import { isInteger } from './is-integer';
import { buildTestCaseRunner } from './utils';

const positiveTestCase = buildTestCaseRunner(true, isInteger);

const negativeTestCase = buildTestCaseRunner(false, isInteger);

describe(`isInteger`, () => {
  describe(`when the input is an integer`, () => {
    positiveTestCase(1);

    positiveTestCase(-100);

    positiveTestCase(0);

    positiveTestCase(-0, { description: 'negative 0' });
  });

  describe(`when the input is not an integer`, () => {
    negativeTestCase('1');

    negativeTestCase(
      { value: 1 },
      { description: 'object with int-valued property' },
    );

    negativeTestCase(
      {
        valueOf() {
          return 100;
        },
      },
      { description: 'object with manual coercion method' },
    );

    negativeTestCase(null, { description: 'null' });

    negativeTestCase(undefined, { description: 'undefined' });

    negativeTestCase(Infinity);

    negativeTestCase(-Infinity);

    negativeTestCase(
      function () {
        return -123;
      },
      { description: 'function' },
    );

    negativeTestCase(() => 100, { description: 'arrow function' });
  });
});
