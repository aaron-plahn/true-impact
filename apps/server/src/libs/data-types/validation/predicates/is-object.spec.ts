import { isObject } from './is-object';
import { buildTestCaseRunner } from './utils';

const positiveTestCase = buildTestCaseRunner(true, isObject);

const negativeTestCase = buildTestCaseRunner(false, isObject);

describe(`isObject`, () => {
  describe(`when the input is a plain JS object`, () => {
    positiveTestCase({
      foo: 2,
      bar: {
        baz: 'hi',
        doSomething: () => {
          console.log('done');
        },
      },
    });
  });

  describe(`when the input is an instance of a class`, () => {
    class Widget {
      foo: number;

      constructor(foo: number) {
        this.foo = foo;
      }

      fooBy(multiplier: number): number {
        return multiplier * this.foo;
      }
    }

    positiveTestCase(new Widget(2222));
  });

  describe(`when the input is a string`, () => {
    negativeTestCase('hello world');
  });

  describe(`when the input is a number`, () => {
    negativeTestCase(123.45);
  });

  describe(`when the input is a function`, () => {
    negativeTestCase(() => 5);
  });

  describe(`when the input is a boolean`, () => {
    negativeTestCase(true);

    negativeTestCase(false);
  });

  describe(`when the input is null`, () => {
    negativeTestCase(null);
  });

  describe(`when the input is undefined`, () => {
    negativeTestCase(undefined);
  });
});
