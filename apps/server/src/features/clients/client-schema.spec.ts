import { getDataSchemaFromClassCtor } from '../../libs/data-types/schema-management/decorators/append-metadata';
import { Client } from './client.aggregate-root';

describe(`ClientSchema`, () => {
  it(`should match the snapshot`, () => {
    const schema = getDataSchemaFromClassCtor(Client);

    expect(schema).toMatchSnapshot();
  });
});
