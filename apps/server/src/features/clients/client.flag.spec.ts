import { buildTestInstance, TrueImpactError } from '../../libs/data-types';
import { assertTextMatchesAll } from '../../libs/test-utils';
import { Client } from './client.aggregate-root';

const clientWithNoFlags = buildTestInstance(
  Client,
  {
    flagIds: [],
  },
  { shouldValidate: true },
);

const firstFlagId = '123';

const clientWithFirstFlag = clientWithNoFlags.flag(firstFlagId) as Client;

describe(`Client.flag`, () => {
  describe(`when the client has no flags`, () => {
    it(`should add the flag`, () => {
      const result = clientWithNoFlags.flag(firstFlagId);

      expect(result).toBeInstanceOf(Client);

      const updated = result as Client;

      expect(updated.hasFlag(firstFlagId)).toBe(true);
    });
  });

  describe(`when the client already has some flags`, () => {
    describe(`when the client does not yet have the new flag`, () => {
      const secondFlagId = '124';

      it(`should add the flag`, () => {
        const result = clientWithFirstFlag.flag(secondFlagId);

        expect(result).toBeInstanceOf(Client);

        const updated = result as Client;

        expect(updated.hasFlag(firstFlagId)).toBe(true);

        expect(updated.hasFlag(secondFlagId)).toBe(true);
      });
    });

    describe(`when the client already has the new flag`, () => {
      it(`should return the expected error`, () => {
        const result = clientWithFirstFlag.flag(firstFlagId);

        expect(result).toBeInstanceOf(TrueImpactError);

        assertTextMatchesAll(
          (result as TrueImpactError).toString(),
          clientWithFirstFlag.getName(),
          firstFlagId,
          'already has',
        );
      });
    });
  });
});
