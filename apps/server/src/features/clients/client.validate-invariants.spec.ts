import { clonePlainObject, TrueImpactError } from '../../libs/data-types';
import { Client, ClientPersistenceDto } from './client.aggregate-root';

// TODO Build test instance
const validDtoWihtoutOptionalProperties: ClientPersistenceDto = {
  id: '1',
  revision: 1,
  fullName: {
    firstName: 'Ronald',
    middleNames: [],
    lastName: 'McDonnald',
  },
  dateOfBirth: '2022-08-01',
  isIndigenous: 'Yes',
  flagIds: [],
  // community: undefined
};

function assertValidInstance<T>(
  input: T | TrueImpactError,
): asserts input is T {
  expect(input).not.toBeInstanceOf(Error);
}

function assertTrueImpactError(
  input: unknown,
): asserts input is TrueImpactError {
  expect(input).toBeInstanceOf(TrueImpactError);
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
          isIndigenous: 'No',
          communityId: 'Blue Lake',
        });

        const invalidInstance = Client.fromPersistenceDto(
          invalidDto as ClientPersistenceDto,
          { shouldValidate: false },
        ) as Client;

        const result = invalidInstance.validateInvariants();

        assertTrueImpactError(result);

        const errorMessage = result.toString();

        expect(errorMessage).toContain(
          `A non-indigenous client cannot be registered to a community`,
        );
      });
    });
    describe(`when the has a community but indigenous is "Unknown"`, () => {
      it(`should return the expected error`, () => {
        const invalidDto = clonePlainObject(validDtoWihtoutOptionalProperties, {
          isIndigenous: 'Unknown',
          communityId: '99',
        });

        const instance = Client.fromPersistenceDto(
          invalidDto as ClientPersistenceDto,
        ) as Client;

        const result = instance.validateInvariants();

        assertTrueImpactError(result);

        const errorMessage = result.toString();

        expect(errorMessage).toContain(
          `When specifying a client's community [99], the client must be listed as Indigenous`,
        );
      });
    });

    describe(`when the community is a number`, () => {
      const invalidInstance = clonePlainObject(
        validDtoWihtoutOptionalProperties,
        {
          communityId: 78,
        },
      );

      it(`should return the expected error`, () => {
        const instance = Client.fromPersistenceDto(
          invalidInstance as unknown as ClientPersistenceDto,
        ) as Client;

        const result = instance.validateInvariants();

        assertTrueImpactError(result);

        const errorMessage = result.toString();

        expect(errorMessage).toContain('78');

        expect(errorMessage).toContain('non-empty text');
      });
    });
  });
});
