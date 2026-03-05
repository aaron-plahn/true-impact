import { deepConvertMapToObject } from './deep-convert-map-to-object';

describe(`deepConvertMapToObject`, () => {
  describe(`when the result is a single map without nesting`, () => {
    it(`should return the expected result`, () => {
      const result = deepConvertMapToObject(
        new Map([
          ['a', 1],
          ['b', 2],
          ['c', 3],
        ]),
      );

      expect(result).toEqual({
        a: 1,
        b: 2,
        c: 3,
      });
    });
  });

  describe(`when the result is a nested map of maps`, () => {
    const result = deepConvertMapToObject(
      new Map()
        .set(
          'a',
          new Map()
            .set('i', { price: 5 })
            .set('ii', { price: 4 })
            .set('iii', { price: 15 }),
        )
        .set(
          'b',
          new Map()
            .set('1', { price: 10 })
            .set('2', { price: 20 })
            .set('3', new Map().set('discout', '50%').set('preferred', '25%')),
        ),
    );

    expect(result).toEqual({
      a: {
        i: { price: 5 },
        ii: { price: 4 },
        iii: { price: 15 },
      },
      b: {
        '1': { price: 10 },
        '2': { price: 20 },
        '3': {
          discount: '50%',
          preferred: '25%',
        },
      },
    });
  });
});
