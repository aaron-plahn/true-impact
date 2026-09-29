import { FullName } from '../../common/full-name';
import { buildTestInstance, TrueImpactError } from '../../libs/data-types';
import { Client } from './client.aggregate-root';
import { ClientCreated } from './commands';

const clientCreated = buildTestInstance(ClientCreated, {
  payload: {
    fullName: FullName.fromString('Ronald McDonnald') as FullName,
    dateOfBirth: '2022-08-01',
    isIndigenous: 'Yes',
  },
});

const validInstance = Client.fromEventHistory([clientCreated]) as Client;

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
        const result = validInstance.validateInvariants();

        assertValidInstance<Client>(result);
      });
    });
  });

  describe(`When the client is invalid`, () => {
    describe(`when the client is listed as non-indigenous, but has an assigned community`, () => {
      it(`should return the expected error`, () => {
        const result = Client.fromEventHistory([
          buildTestInstance(ClientCreated, {
            payload: {
              communityId: '44',
              isIndigenous: 'No',
            },
          }),
        ]);

        assertTrueImpactError(result);

        const errorMessage = result.toString();

        expect(errorMessage).toContain(
          `A non-indigenous client cannot be registered to a community`,
        );
      });
    });
    describe(`when the has a community but indigenous is "Unknown"`, () => {
      it(`should return the expected error`, () => {
        const result = Client.fromEventHistory([
          buildTestInstance(ClientCreated, {
            payload: {
              /**
               * Command validation should have prevented this situation. But
               * what if we update our invariant validation rules? We have to ensure
               * that the invariants still hold.
               */
              isIndigenous: 'Unknown',
              communityId: '99',
            },
          }),
        ]) as Client;

        assertTrueImpactError(result);

        const errorMessage = result.toString();

        expect(errorMessage).toContain(
          `When specifying a client's community [99], the client must be listed as Indigenous`,
        );
      });
    });

    describe(`when the community is a number`, () => {
      const result = Client.fromEventHistory([
        buildTestInstance(ClientCreated, {
          payload: {
            communityId: 78 as unknown as string,
          },
        }),
      ]) as Client;

      it(`should return the expected error`, () => {
        assertTrueImpactError(result);

        const errorMessage = result.toString();

        expect(errorMessage).toContain('78');

        expect(errorMessage).toContain('non-empty text');
      });
    });
  });
});
