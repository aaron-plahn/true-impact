import { isEmailAddress } from './is-email-address';
import { buildTestCaseRunner } from './utils';

const positiveTestCase = buildTestCaseRunner(true, isEmailAddress);

const negativeTestCase = buildTestCaseRunner(false, isEmailAddress);

const MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_TLD = 63;

const MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_DOMAIN_NAME = 255;

describe(`isEmailAddress`, () => {
  describe(`when the input is a valid email address`, () => {
    positiveTestCase('abc@mysupercoolacemdomain.org');

    positiveTestCase(
      `abc@mydomain.${'x'.repeat(MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_TLD)}`,
    );

    positiveTestCase(
      `abc@${'a'.repeat(MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_DOMAIN_NAME - 3)}.bb`,
    );
  });

  describe(`when the input is an invalid email address`, () => {
    negativeTestCase('abc');

    negativeTestCase('mysupercoolacmedomain.org');

    negativeTestCase(1234);

    negativeTestCase('abc@');

    negativeTestCase('@');

    negativeTestCase('abc@somedomainnotld');

    negativeTestCase('abc@mydomain.x');

    negativeTestCase(
      `abc@mydomain.${'x'.repeat(MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_TLD + 1)}`,
    );

    negativeTestCase(
      `abc@${'a'.repeat(MAXIMUM_NUMBER_OF_CHARACTERS_IN_A_DOMAIN_NAME - 2)}.bb`,
    );
  });
});
