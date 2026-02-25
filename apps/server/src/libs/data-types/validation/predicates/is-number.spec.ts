import { isNumber } from './is-number';
import { buildTestCaseRunner } from './utils';

const positiveTestCase = buildTestCaseRunner(true, isNumber);

const negativeTestCase = buildTestCaseRunner(false, isNumber);

describe(`isNumber`, () => {
  describe(`when the input is a number`, () => {
    positiveTestCase(7);

    positiveTestCase(0);

    positiveTestCase(-0);

    positiveTestCase(-100);

    positiveTestCase(-56.89);

    positiveTestCase(189.22345);

    positiveTestCase(Math.PI);

    positiveTestCase(Infinity);

    positiveTestCase(-Infinity);
  });

  describe(`when the input is not a number`, () => {
    negativeTestCase('1');

    negativeTestCase('5.5555');

    negativeTestCase(Number.NaN);

    negativeTestCase({}, { description: 'empty object' });

    negativeTestCase(
      { foo: 5 },
      { description: 'object with int-valued property' },
    );

    negativeTestCase(
      { value: 3 },
      { description: 'object with explicit value property' },
    );

    negativeTestCase(
      {
        valueOf() {
          return 100.5;
        },
      },
      {
        description: 'object with number coercion method',
      },
    );

    negativeTestCase(true);

    negativeTestCase(false);

    negativeTestCase(null, { description: 'null' });

    negativeTestCase(undefined);
  });
});
