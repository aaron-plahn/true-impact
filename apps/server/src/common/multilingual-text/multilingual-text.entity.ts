import {
  Entity,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs/data-types';
import { LookupTable } from '../../libs/data-types/schema-management/decorators/lookup-table.decorator';
import { MultilingualTextItemRole } from './multilingual-text-item-role.enum';
import {
  MultilingualTextItem,
  MultilingualTextItemPersistenceDto,
} from './multilingual-text-item.entity';

const DEFAULT_LANGUAGE_CODE = 'en';

const allowedTranslationLanguageCodes = new Set(['clc']);

type LanguageCode = string;

export class MultilingualTextPersistenceDto {
  @LookupTable(() => MultilingualTextItemPersistenceDto, {
    depth: 2,
    label: 'items',
    description:
      'a 2-step lookup table from language code to translation type to text items',
  })
  items: Record<
    LanguageCode,
    Partial<
      Record<MultilingualTextItemRole, MultilingualTextItemPersistenceDto>
    >
  >;
}

@TrueImpactDataExample<MultilingualTextPersistenceDto>({
  example: {
    items: {
      en: {
        [MultilingualTextItemRole.original]: {
          text: 'horse',
        },
      },
    },
  },
})
export class MultilingualText extends Entity<MultilingualTextPersistenceDto> {
  items: Map<LanguageCode, Map<MultilingualTextItemRole, MultilingualTextItem>>; // lookup table from languageCode -> translation role -> text

  constructor({
    items,
  }: {
    items: Map<
      LanguageCode,
      Map<MultilingualTextItemRole, MultilingualTextItem>
    >;
  }) {
    super();

    this.items = items;
  }

  @UpdateMethod()
  translateFreely({
    text,
    languageCode,
  }: {
    text: string;
    languageCode: string;
  }): MultilingualText | TrueImpactError {
    if (!allowedTranslationLanguageCodes.has(languageCode)) {
      if (languageCode === 'en') {
        return new TrueImpactError(
          `Translating text to English [en] is not yet supported`,
        );
      }

      return new TrueImpactError(
        `You cannot make the translation [${text}] to multilingual text [${this.getOriginalTextItem()?.text}] using unknown language with code [${languageCode}]`,
      );
    }

    if (this.has(languageCode)) {
      return new TrueImpactError(
        `You cannot translate [${this.getOriginalTextItem()?.text}] as [${text}], because there is already a translation [${this.get(languageCode)?.text || '-'}] in the target language [${languageCode}]`,
      );
    }

    const translationsByLanguage =
      this.items.get(languageCode) ||
      new Map<MultilingualTextItemRole, MultilingualTextItem>();

    translationsByLanguage.set(
      MultilingualTextItemRole.freeTranslation,
      new MultilingualTextItem({ text }),
    );

    this.items.set(languageCode, translationsByLanguage);

    return this;
  }

  /**
   * There cannot be duplicates for a given language (by design).
   *
   * There can only be one item with the role `original`
   */
  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    const originalItems = Array.from(this.items.entries()).flatMap(
      ([languageCode, itemsByTranslationType]): {
        languageCode: LanguageCode;
        text: string;
      }[] =>
        itemsByTranslationType.has(MultilingualTextItemRole.original)
          ? [
              {
                languageCode,
                text: itemsByTranslationType.get(
                  MultilingualTextItemRole.original,
                )?.text as string,
              },
            ]
          : [],
    );

    if (originalItems.length === 0) {
      allErrors.push(
        new TrueImpactError(
          `Encountered empty multilingual text. Multilingual text must have an original item.`,
        ),
      );
    }

    if (originalItems.length > 1) {
      allErrors.push(
        new TrueImpactError(
          `Encountered multilingual text with multiple languages [${originalItems.map(({ languageCode }) => languageCode).join(',')}] marked as the original.`,
        ),
      );
    }

    return allErrors;
  }

  getId(): string {
    /**
     * Other properties could have the same type on a given aggregate root.
     * But if we want to ensure that this text is unique among a list of other values, the text \ languageCode
     * combo would ensure this.
     */
    return this.getOriginalTextItem()?.text || 'MultilingualText<EMPTY>';
  }

  getOriginalTextItem(): { text: string } | null {
    const searchResult = Array.from(this.items.values()).flatMap(
      (textByTranslationRole) =>
        textByTranslationRole.has(MultilingualTextItemRole.original)
          ? [
              textByTranslationRole.get(
                MultilingualTextItemRole.original,
              ) as MultilingualTextItem,
            ]
          : [],
    );

    if (searchResult.length === 0) {
      return null;
    }

    // invariant validation guarantees there will be one and only one result
    return searchResult[0];
  }

  has(languageCode: string): boolean {
    return this.items.has(languageCode);
  }

  get(
    languageCode: string,
    role: MultilingualTextItemRole = MultilingualTextItemRole.freeTranslation,
  ): MultilingualTextItem | null {
    return this.items.get(languageCode)?.get(role) || null;
  }

  override toString(): string {
    return this.getOriginalTextItem()?.text || 'MultilingualText<Empty>';
  }

  getName(): string {
    return this.getOriginalTextItem()?.text || 'MultilingualText<Empty>';
  }

  toPersistenceDto(): MultilingualTextPersistenceDto {
    const items: Record<
      LanguageCode,
      Record<MultilingualTextItemRole, MultilingualTextItemPersistenceDto>
    > = {};

    this.items.forEach((itemsByTranslationType, languageCode) => {
      items[languageCode] = {} as Record<
        MultilingualTextItemRole,
        MultilingualTextItemPersistenceDto
      >;

      itemsByTranslationType.forEach((item, translationRole) => {
        items[languageCode][translationRole] = item;
      });
    });

    return {
      items,
    };
  }

  static withText({
    text,
    languageCode,
  }: {
    text: string;
    languageCode?: string;
  }): MultilingualText | TrueImpactError {
    const itemsForOriginalLanguage = new Map<
      MultilingualTextItemRole,
      MultilingualTextItem
    >();

    itemsForOriginalLanguage.set(
      MultilingualTextItemRole.original,
      new MultilingualTextItem({
        text,
      }),
    );

    const instance = new MultilingualText({
      items: new Map<
        LanguageCode,
        Map<MultilingualTextItemRole, MultilingualTextItem>
      >().set(languageCode || DEFAULT_LANGUAGE_CODE, itemsForOriginalLanguage),
    });

    return instance.validateInvariants();
  }

  static fromPersistenceDto(
    dto: MultilingualTextPersistenceDto,
    _buildOptions?: { shouldValidate?: boolean },
  ): MultilingualText | TrueImpactError {
    const items = new Map<
      MultilingualTextItemRole,
      Map<MultilingualTextItemRole, MultilingualTextItem>
    >();

    const itemErrors: TrueImpactError[] = [];

    Object.entries(dto.items).forEach(
      ([languageCode, itemsByTranslationType]: [
        MultilingualTextItemRole,
        Record<MultilingualTextItemRole, MultilingualTextItemPersistenceDto>,
      ]) => {
        items.set(languageCode, new Map());

        Object.entries(itemsByTranslationType).forEach(
          ([translationRole, itemDto]: [
            MultilingualTextItemRole,
            MultilingualTextItemPersistenceDto,
          ]) => {
            const itemBuildResult =
              MultilingualTextItem.fromPersistenceDto(itemDto);

            if (itemBuildResult instanceof TrueImpactError) {
              itemErrors.push(itemBuildResult);

              return;
            } else {
              items.get(languageCode)?.set(translationRole, itemBuildResult);
            }
          },
        );
      },
    );

    return new MultilingualText({
      items,
    });
  }
}
