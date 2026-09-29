import { getDataSchemaFromClassCtor } from '../../libs/data-types/schema-management/decorators/append-metadata';
import { Client } from './client.aggregate-root';

/**
 * TODO We don't want to test a specific domain model. Instead,
 * we should have a test for a toy model's schema in our data-types lib.
 */
describe(`ClientSchema`, () => {
  it(`should match the snapshot`, () => {
    const schema = getDataSchemaFromClassCtor(Client);

    expect(schema).toMatchSnapshot();
  });
});
