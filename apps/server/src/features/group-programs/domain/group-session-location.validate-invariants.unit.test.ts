/* eslint-disable @typescript-eslint/no-floating-promises */
import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { isDeepStrictEqual } from 'node:util';
import { buildTestInstance } from '../../../libs/data-types';
import { GroupSessionLocation } from './group-session-location.value-object';

const assertValid = (instance: GroupSessionLocation) => {
  const result = instance.validateComplexInvariants();

  assert(isDeepStrictEqual(result, []));
};

const hasLength = (input: unknown): input is { length: number } => {
  return Number.isInteger((input as { length: number }).length);
};

const expect = (
  value: unknown,
  // { shouldIgnoreCase }: { shouldIgnoreCase: boolean } = {
  //   shouldIgnoreCase: false,
  // },
) => ({
  toContainText(...patternsToMatch: string[]) {
    if (typeof value !== 'string') {
      throw new Error(
        `${JSON.stringify(value)} must be a string to contain text`,
      );
    }

    for (const pattern of patternsToMatch) {
      assert(
        value.includes(pattern),
        `Expected: ${value} to contain text ${pattern}, but it did not.`,
      );
    }
  },
  toHaveLength(expectedLength: number) {
    if (!Number.isInteger(expectedLength)) {
      throw new Error(
        `toHaveLength(${expectedLength}) failed. Expected an integer.`,
      );
    }

    if (value === null) {
      throw new Error(
        `Expected a value with a length property, but received null`,
      );
    }

    if (typeof value === 'undefined') {
      throw new Error(
        `Expected a value with length property, but received undefined.`,
      );
    }

    if (!hasLength(value)) {
      throw new Error(
        `Expected a value with an integer length property, but received: ${JSON.stringify(value)}`,
      );
    }

    if (value.length !== expectedLength) {
      throw new Error(
        `Expected length [${expectedLength}]. Received [${value.length}]:\n${JSON.stringify(value)}`,
      );
    }
  },
});

describe(`GroupSessionLocation.validateInvariants`, () => {
  describe(`when the location is valid`, () => {
    describe(`when specifying a location by name`, () => {
      it(`should return no errors`, () => {
        const validLocation = buildTestInstance(GroupSessionLocation, {
          name: 'Niceville',
          isUrban: true,
        });

        assertValid(validLocation);
      });
    });

    describe(`when specifying a location by geospatial coordinates`, () => {
      // not yet supported
      it.todo(`should return no errors`);
    });
  });

  describe(`when the location is invalid`, () => {
    // TODO Support this use case
    describe(`when specifying a community ID`, () => {
      it.only(`should return no errors`, () => {
        const invalidLocation = buildTestInstance(
          GroupSessionLocation,
          {
            communityId: '123',
          },
          { shouldValidate: false },
        );

        const result = invalidLocation.validateComplexInvariants();

        expect(result).toHaveLength(1);

        const message = result[0].toString();

        expect(message).toContainText('not yet supported');
      });
    });

    describe(`when all properties are omittied`, () => {
      it(`should return the expected error`, () => {
        const invalidInstance = buildTestInstance(
          GroupSessionLocation,
          {},
          { shouldValidate: false },
        );

        const result = invalidInstance.validateComplexInvariants();

        expect(result).toHaveLength(1);

        const message = result[0].toString();

        expect(message).toContainText('Inconsistent location definition');
      });
    });

    describe(`when community ID and another property are specified`, () => {
      describe(`+name`, () => {
        it(`should return the expected error`, () => {
          const communityId = 'TS123';

          const name = 'Little River';

          const instanceWithCommunityAndName = buildTestInstance(
            GroupSessionLocation,
            {
              communityId,
              name,
            },
            {
              shouldValidate: false,
            },
          );

          const result =
            instanceWithCommunityAndName.validateComplexInvariants();

          /**
           * We will get a second error saying that specifying a location by community ID is not yet supported.
           */
          const filteredResult = result.filter(
            (r) => !r.toString().includes('not yet supported'),
          );

          expect(filteredResult).toHaveLength(1);

          const message = filteredResult[0].toString();

          expect(message).toContainText(
            'name and a community',
            'cannot both be specified',
          );
        });
      });
    });

    describe(`when geospatial coordinates and another property are specified`, () => {
      // geospatial coordinates are not yet supported
      it.todo(`should return the expected error`);
    });
  });
});
