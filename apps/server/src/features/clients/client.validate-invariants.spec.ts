import { clonePlainObject } from '@true-impact/data-types';
import { TrueImpactError } from '@true-impact/data-types/error-handling';
import { Client, ClientPeristenceDto } from './client.aggregate-root';

// TODO Build test instance
const validDtoWihtoutOptionalProperties: ClientPeristenceDto = {
  fullName: {
    firstName: 'Ronald',
    // middleName: undefined,
    lastName: 'McDonnald',
  },
  dateOfBirth: '2022-08-01',
  isIndigenous: 'Yes',
  // community: undefined
};

function assertValidInstance<T>(
  input: T | TrueImpactError,
): asserts input is T {
  expect(input).not.toBeInstanceOf(Error);
}

describe(`Client.validateInvariants`, () => {
  describe(`When the client is valid`, () => {
    describe(`when all optional properties are omitted`, () => {
      it(`should return the expected instance`, () => {
        const result = Client.fromPersistenceDto(
          validDtoWihtoutOptionalProperties,
        );

        assertValidInstance<Client>(result);

        expect(result.toPersistenceDto()).toEqual(
          validDtoWihtoutOptionalProperties,
        );
      });
    });
  });

  describe(`When the client is invalid`, () => {
    describe(`when the client is listed as non-indigenous, but has an assigned community`, () => {
      it(`should return the expected error`, () => {
        const invalidDto = clonePlainObject(validDtoWihtoutOptionalProperties, {
          isIndigenous: false,
          community: 'Blue Lake',
        });

        const result = Client.fromPersistenceDto(
          invalidDto as ClientPeristenceDto,
        );

        expect(result).toBeInstanceOf(TrueImpactError);

        const errorMessage = result.toString();

        expect(errorMessage).toContain(
          `A non-indigenous client cannot be registered to a community`,
        );
      });
    });

    describe(`when the community is a number`, () => {
      const invalidInstance = clonePlainObject(
        validDtoWihtoutOptionalProperties,
        {
          community: 78,
        },
      );

      it(`should return the expected error`, () => {
        const result = Client.fromPersistenceDto(
          invalidInstance as unknown as ClientPeristenceDto,
        );

        expect(result).toBeInstanceOf(TrueImpactError);

        const errorMessage = result.toString();

        expect(errorMessage).toContain('78');

        expect(errorMessage).toContain('non-empty text');
      });
    });
  });
});
