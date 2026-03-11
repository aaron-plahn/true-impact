import {
  Entity,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../libs/data-types';

export class MultilingualTextItemPersistenceDto {
  text: string;

  languageCode: string;

  constructor({ text, languageCode }: { text: string; languageCode: string }) {
    this.text = text;

    this.languageCode = languageCode;
  }
}

// TODO Why don't we decorate the DTO with this instead?
@TrueImpactDataExample<MultilingualTextItemPersistenceDto>({
  example: {
    text: 'hat',
    languageCode: 'clc',
  },
})
export class MultilingualTextItem extends Entity<MultilingualTextItemPersistenceDto> {
  text: string;
  languageCode: string;

  constructor({ text, languageCode }: { text: string; languageCode: string }) {
    super();

    this.text = text;

    this.languageCode = languageCode;
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
      languageCode: this.languageCode,
    };
  }

  static fromPersistenceDto(
    { text, languageCode }: MultilingualTextItemPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): MultilingualTextItem | TrueImpactError {
    const instance = new MultilingualTextItem({
      text,
      languageCode,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
