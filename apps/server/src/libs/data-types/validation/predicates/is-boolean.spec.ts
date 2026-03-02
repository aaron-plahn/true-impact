import { isBoolean } from './is-boolean';
import { buildTestCaseRunner } from './utils';

const positiveTestCase = buildTestCaseRunner(true, isBoolean);

const negativeTestCase = buildTestCaseRunner(false, isBoolean);

describe(`isBoolean`, () => {
  describe(`when the input is a boolean`, () => {
    positiveTestCase(true);

    positiveTestCase(false);
  });

  describe(`when the input is not a boolean`, () => {
    negativeTestCase(0);

    negativeTestCase(1);

    negativeTestCase(-100.1);

    negativeTestCase('true');

    negativeTestCase('false');

    negativeTestCase(
      { value: true },
      { description: 'object with boolean-valued property' },
    );

    negativeTestCase(
      {
        toBoolean() {
          return false;
        },
      },
      { description: 'object with toBoolean' },
    );

    negativeTestCase({}, { description: 'empty object' });
  });
});
