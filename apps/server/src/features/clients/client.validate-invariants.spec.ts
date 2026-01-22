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

function assertValidInstance<T>(input: T | Error): asserts input is T {
  expect(input).not.toBeInstanceOf(Error);
}

describe(`Client.validateInvariants`, () => {
  describe(`When the client is valid`, () => {
    describe(`when all optional properties are omitted`, () => {
      it(`should return the expected instance`, () => {
        const result = Client.fromPersistenceDto(validDtoWihtoutOptionalProperties);

        assertValidInstance<Client>(result);

        expect(result.toPersistenceDto()).toEqual(validDtoWihtoutOptionalProperties);
      });
    });
  });
});
