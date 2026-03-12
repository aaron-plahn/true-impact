import { MultilingualTextItemRole } from '../../../common/multilingual-text';
import {
  buildTestInstance,
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import { Community } from './community.aggregate-root';

const translation = 'Biny Gunchagh';

const communityWithEnglishNameOnly = buildTestInstance(
  Community,
  {
    name: {
      items: {
        [MultilingualTextItemRole.original]: {
          text: 'Big Creek',
          languageCode: 'en',
        },
      },
    },
  },
  { shouldValidate: true },
);

describe(`Community.translateName`, () => {
  describe(`when the language code is known`, () => {
    describe(`when the community's name has not been translated into the target language`, () => {
      it(`should add a free translation for the community name`, () => {
        const result = communityWithEnglishNameOnly.translateName({
          text: translation,
          languageCode: 'clc',
        });

        expect(result).toBeInstanceOf(Community);

        const updated = result as Community;

        expect(updated.name);
      });
    });

    describe(`when the community's name has already been translated into the target language`, () => {
      const translationLanguageCode = 'clc';

      const existingTranslation = 'Translation of Name';

      const extraneousTranslation = 'Second Translation of Name';

      const communityWithTranslationOfName = buildTestInstance(
        Community,
        {
          name: {
            items: {
              [MultilingualTextItemRole.original]: {
                text: 'Original Name',
                languageCode: 'en',
              },
              [MultilingualTextItemRole.freeTranslation]: {
                text: existingTranslation,
                languageCode: 'clc',
              },
            },
          },
        },
        { shouldValidate: true },
      );

      it(`should return the expected error`, () => {
        const result = communityWithTranslationOfName.translateName({
          text: extraneousTranslation,
          languageCode: translationLanguageCode,
        });

        expect(result).toBeInstanceOf(TrueImpactError);

        assertTextMatchesAll(
          (result as TrueImpactBadUserInputError).toString(),
          extraneousTranslation,
          translationLanguageCode,
          'already',
          existingTranslation,
        );
      });
    });
  });

  describe(`when the language code is unknown`, () => {
    describe(`when the language code is not 'clc`, () => {
      /**
       * Note that we will eventually support translating from
       * any known original to any known secondary language. For now,
       * the only translations we allow are 'en' -> 'clc' for simplicity.
       */
      describe(`en`, () => {
        const invalidLanguageCode = 'en';

        it(`should return the expected error`, () => {
          const result = communityWithEnglishNameOnly.translateName({
            text: translation,
            languageCode: invalidLanguageCode,
          });

          expect(result).toBeInstanceOf(TrueImpactError);

          assertTextMatchesAll(
            (result as TrueImpactError).toString(),
            invalidLanguageCode,
            'not yet supported',
          );
        });
      });

      describe(`fr`, () => {
        const invalidLanguageCode = 'fr';

        it(`should return the expected error`, () => {
          const result = communityWithEnglishNameOnly.translateName({
            text: translation,
            languageCode: invalidLanguageCode,
          });

          expect(result).toBeInstanceOf(TrueImpactError);

          assertTextMatchesAll(
            (result as TrueImpactError).toString(),
            invalidLanguageCode,
            'unknown language',
          );
        });
      });
    });
  });
});
