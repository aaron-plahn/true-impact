import {
  Entity,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../libs/data-types';
import { MultilingualTextItemRole } from './multilingual-text-item-role.enum';
import {
  MultilingualTextItem,
  MultilingualTextItemPersistenceDto,
} from './multilingual-text-item.entity';

const DEFAULT_LANGUAGE_CODE = 'en';

const allowedTranslationLanguageCodes = new Set(['clc']);

export class MultilingualTextPersistenceDto {
  items: Partial<
    Record<MultilingualTextItemRole, MultilingualTextItemPersistenceDto>
  >;
}

@TrueImpactDataExample<MultilingualTextPersistenceDto>({
  example: {
    items: {
      [MultilingualTextItemRole.original]: {
        text: 'horse',
        languageCode: 'en',
        role: MultilingualTextItemRole.original,
      } as MultilingualTextItemPersistenceDto,
    },
  },
})
export class MultilingualText extends Entity<MultilingualTextPersistenceDto> {
  items: Map<MultilingualTextItemRole, MultilingualTextItem>; // lookup table from role -> item

  constructor({
    items,
  }: {
    items: Map<MultilingualTextItemRole, MultilingualTextItem>;
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
        `You cannot make the translation [${text}] to multilingual text [${this.getOriginalTextItem().toString()}] using unknown language with code [${languageCode}]`,
      );
    }

    if (this.has(languageCode)) {
      return new TrueImpactError(
        `You cannot translate [${this.getOriginalTextItem().toString()}] as [${text}], because there is already a translation [${this.get(languageCode)?.text || '-'}] in the target language [${languageCode}]`,
      );
    }

    this.items.set(
      MultilingualTextItemRole.freeTranslation,
      new MultilingualTextItem({
        text,
        languageCode,
      }),
    );

    return this;
  }

  /**
   * There cannot be duplicates for a given language (by design).
   *
   * There can only be one item with the role `original`
   */
  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    if (!this.items.has(MultilingualTextItemRole.original)) {
      allErrors.push(
        new TrueImpactError(
          `Encountered empty multilingual text. Multilingual text must have an original item.`,
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
    return this.getOriginalTextItem().toString();
  }

  getOriginalTextItem(): MultilingualTextItem {
    return this.items.get(
      MultilingualTextItemRole.original,
    ) as MultilingualTextItem;
  }

  has(languageCode: string): boolean {
    return Array.from(this.items.values()).some(
      (item) => item.languageCode === languageCode,
    );
  }

  get(languageCode: string): MultilingualTextItem | null {
    return (
      Array.from(this.items.values()).find(
        (item) => item.languageCode === languageCode,
      ) || null
    );
  }

  getName(): string {
    if (!this.items.has(MultilingualTextItemRole.original)) {
      return `MultilingualText<EMPTY>`;
    }

    return (
      this.items.get(MultilingualTextItemRole.original) as MultilingualTextItem
    ).text;
  }

  toPersistenceDto(): MultilingualTextPersistenceDto {
    const items: Record<string, MultilingualTextItemPersistenceDto> = {};

    this.items.forEach((item, role) => {
      items[role] = item.toPersistenceDto();
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
    const instance = new MultilingualText({
      items: new Map<MultilingualTextItemRole, MultilingualTextItem>().set(
        MultilingualTextItemRole.original,
        new MultilingualTextItem({
          text,
          languageCode: languageCode || DEFAULT_LANGUAGE_CODE,
        }),
      ),
    });

    return instance.validateInvariants();
  }

  static fromPersistenceDto(
    dto: MultilingualTextPersistenceDto,
    _buildOptions?: { shouldValidate?: boolean },
  ): MultilingualText | TrueImpactError {
    const items = new Map<MultilingualTextItemRole, MultilingualTextItem>();

    const itemErrors: TrueImpactError[] = [];

    Object.entries(dto.items).forEach(
      ([role, itemDto]: [
        MultilingualTextItemRole,
        MultilingualTextItemPersistenceDto,
      ]) => {
        const itemBuildResult =
          MultilingualTextItem.fromPersistenceDto(itemDto);

        if (itemBuildResult instanceof TrueImpactError) {
          itemErrors.push(itemBuildResult);

          return;
        }

        items.set(role, itemBuildResult);
      },
    );

    return new MultilingualText({
      items,
    });
  }
}
