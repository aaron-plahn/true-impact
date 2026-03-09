import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import { Flag } from './flag.aggregate-root';

const flagId = '555';

const existingLabel = 'violent tendencies';

describe(`Flag.relabel`, () => {
  const flagWithLabel = buildTestInstance(Flag, {
    id: flagId,
    label: existingLabel,
  });

  describe(`when the new label is different than the previous label`, () => {
    const newLabel = 'has foul gas';

    it(`should update the flag's label`, () => {
      const result = flagWithLabel.relabel({ newLabel });

      expect(result).toBeInstanceOf(Flag);

      const updated = result as Flag;

      expect(updated.label).toBe(newLabel);
    });
  });

  describe(`when the new label is the same as the previous label`, () => {
    it(`should return the expected error`, () => {
      const result = flagWithLabel.relabel({ newLabel: existingLabel });

      expect(result).toBeInstanceOf(TrueImpactError);

      assertTextMatchesAll(
        (result as TrueImpactError).toString(),
        existingLabel,
        flagId,
        'already has the label',
      );
    });
  });
});
