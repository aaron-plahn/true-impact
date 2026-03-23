import {
  Entity,
  NonEmptyString,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../libs/data-types';

export class MultilingualTextItemPersistenceDto {
  text: string;

  constructor({ text }: { text: string }) {
    this.text = text;
  }
}

// TODO Why don't we decorate the DTO with this instead?
@TrueImpactDataExample<MultilingualTextItemPersistenceDto>({
  example: {
    text: 'hat',
  },
})
export class MultilingualTextItem extends Entity<MultilingualTextItemPersistenceDto> {
  @NonEmptyString({
    label: 'text',
    description: 'text in the given language',
  })
  text: string;

  @NonEmptyString({
    label: 'language code',
    description: 'specifies the language for a multilingual text item',
  })
  languageCode: string;

  constructor({ text }: { text: string }) {
    super();

    this.text = text;
  }

  validateComplexInvariants(): TrueImpactError[] {
    // the only validation that applies is the simple schema-based validation
    return [];
  }

  getId(): string {
    return this.languageCode;
  }

  getName(): string {
    return this.text;
  }

  override toString(): string {
    return `${this.text} [${this.languageCode}]`;
  }

  toPersistenceDto(): MultilingualTextItemPersistenceDto {
    return {
      text: this.text,
    };
  }

  static fromPersistenceDto(
    { text }: MultilingualTextItemPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): MultilingualTextItem | TrueImpactError {
    const instance = new MultilingualTextItem({
      text,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
