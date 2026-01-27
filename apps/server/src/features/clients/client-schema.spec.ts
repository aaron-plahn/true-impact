import { getDataSchemaFromPrototype } from '@true-impact/data-types';
import { Client } from './client.aggregate-root';

describe(`ClientSchema`, () => {
  it(`should match the snapshot`, () => {
    const schema = getDataSchemaFromPrototype(Client.prototype);

    expect(schema).toMatchSnapshot();
  });
});
