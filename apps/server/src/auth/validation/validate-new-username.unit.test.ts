/* eslint-disable @typescript-eslint/no-floating-promises */
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { TrueImpactError } from '../../libs/data-types';
import { validateNewUsername } from './validate-new-username';

const validShortUsername = 'abc';

const validLongUsername = `abcdefghijklmnopqrst`;

const stringifyErrors = (errors: TrueImpactError[]) =>
  errors.map((e) => e.toString()).join('\n');

const assertInvalidSymbolError = (invalidSymbol: string) => {
  const invalidUsername = `${validShortUsername}${invalidSymbol}a`;

  const result = validateNewUsername(invalidUsername);

  assert(result.length === 1, stringifyErrors(result));

  const targetMessage = result[0].toString();

  const expectedMessage =
    'Username must be 3-20 alphanumeric characters or underscores.';

  assert(
    targetMessage.includes(expectedMessage),
    `Expected: ${targetMessage} to include *${expectedMessage}*, but it did not.`,
  );
};

describe(`validatePasswordStrength`, () => {
  describe(`when the username is valid`, () => {
    describe(`when it has the shortest possible length for a username [3]`, () => {
      it(`should return no errors`, () => {
        const result = validateNewUsername(validShortUsername);

        assert(
          result.length === 0,
          `Expected no errors, received:\n${result
            .map((e) => e.toString())
            .join('\n')} `,
        );
      });
    });

    describe(`when it has the longest possible length for a username [20]`, () => {
      assert(validLongUsername.length === 20);

      it(`should return no errors`, () => {
        const result = validateNewUsername(validLongUsername);

        assert(
          result.length === 0,
          `Expected no errors for username: ${validLongUsername}. \nReceived: ${stringifyErrors(result)}`,
        );
      });
    });
  });

  describe(`when the username is too short`, () => {
    it(`should return the expected error`, () => {
      const shortUsername = 'bs';

      const result = validateNewUsername(shortUsername);

      assert(
        result.length === 1,
        `Expected exactly one error for invalid password: ${shortUsername}.\n${stringifyErrors(result)}`,
      );

      const targetError = result[0];

      const targetMessage = targetError.toString();

      assert(targetMessage.includes(''));

      assert(result[0]);
    });
  });

  describe(`when the username is too long`, () => {
    const tooLongUsername = `${validLongUsername}s`;

    const result = validateNewUsername(tooLongUsername);

    assert(
      result.length === 1,
      `Expected exactly one error for the invalid username: ${validLongUsername} [too long].\nReceived: ${stringifyErrors(result)}`,
    );

    const targetMessage = result[0].toString();

    const expectedMessage = 'Username must be 20 characters or less';

    assert(
      targetMessage.includes(expectedMessage),
      `Expected error message: ${targetMessage} to include: ${expectedMessage}.`,
    );
  });

  describe(`when the username contains a dissallowed symbol`, () => {
    describe(`@`, () => {
      it(`should return the expected error`, () => {
        assertInvalidSymbolError('@');
      });
    });

    describe(`-`, () => {
      it(`should return the expected error`, () => {
        assertInvalidSymbolError('-');
      });
    });
  });
});
