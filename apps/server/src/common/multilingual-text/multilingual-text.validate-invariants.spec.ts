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
          en: {
            [MultilingualTextItemRole.original]: buildTestInstance(
              MultilingualTextItem,
              {
                text: 'bla bla bla',
              },
            ),
          },
        },
      });

      const result = validInstance.validateInvariants();

      expect(result).toBeInstanceOf(MultilingualText);
    });
  });

  describe(`when the text is invalid`, () => {
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
