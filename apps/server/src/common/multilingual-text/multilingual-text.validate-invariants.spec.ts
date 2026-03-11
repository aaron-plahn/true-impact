import { buildTestInstance, TrueImpactError } from '../../libs/data-types';
import { assertTextMatchesAll } from '../../libs/test-utils';
import { MultilingualTextItemRole } from './multilingual-text-item-role.enum';
import { MultilingualTextItem } from './multilingual-text-item.entity';
import { MultilingualText } from './multilingual-text.entity';

describe(`MultilingualText.validateInvariants`, () => {
  describe(`when the text is valid`, () => {
    it(`should return the instance`, () => {
      const validInstance = buildTestInstance(MultilingualText, {
        items: {
          [MultilingualTextItemRole.original]: buildTestInstance(
            MultilingualTextItem,
            {
              role: MultilingualTextItemRole.original,
            },
          ),
        },
      });

      const result = validInstance.validateInvariants();

      expect(result).toBeInstanceOf(MultilingualText);
    });
  });

  describe(`when the text is invalid`, () => {
    describe(`when one of the item keys does not match the corresponding role`, () => {
      const textForInvalidItem = 'foo';
      const invalidRoleThatIsUsedAsKey = MultilingualTextItemRole.free;
      const invalidRoleThatIsUsedOnItem = MultilingualTextItemRole.original;

      it(`should return the expected errors`, () => {
        const invalidInstance = buildTestInstance(MultilingualText, {
          items: {
            [MultilingualTextItemRole.original]: buildTestInstance(
              MultilingualTextItem,
              {
                role: MultilingualTextItemRole.original,
              },
            ),
            [invalidRoleThatIsUsedAsKey]: buildTestInstance(
              MultilingualTextItem,
              {
                text: textForInvalidItem,
                // this is wrong
                role: invalidRoleThatIsUsedOnItem,
              },
            ),
          },
        });

        const result = invalidInstance.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        assertTextMatchesAll(
          (result as TrueImpactError).toString(),
          textForInvalidItem,
          invalidRoleThatIsUsedAsKey,
          invalidRoleThatIsUsedOnItem,
        );
      });
    });

    describe(`when no original has been declared`, () => {
      it(`should return the expected error`, () => {
        const invalidInstance = buildTestInstance(MultilingualText, {
          items: {},
        });

        const result = invalidInstance.validateInvariants();

        expect(result).toBeInstanceOf(TrueImpactError);

        assertTextMatchesAll(
          (result as TrueImpactError).toString(),
          'must have an original item',
        );
      });
    });
  });
});
