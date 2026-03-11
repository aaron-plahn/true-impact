import {
  Entity,
  TrueImpactDataExample,
  TrueImpactError,
} from '../../libs/data-types';
import { MultilingualTextItemRole } from './multilingual-text-item-role.enum';

export class MultilingualTextItemPersistenceDto {
  text: string;

  languageCode: string;

  role: MultilingualTextItemRole;

  constructor({
    text,
    languageCode,
    role,
  }: {
    text: string;
    languageCode: string;
    role: MultilingualTextItemRole;
  }) {
    this.text = text;

    this.languageCode = languageCode;

    this.role = role;
  }
}

// TODO Why don't we decorate the DTO with this instead?
@TrueImpactDataExample<MultilingualTextItemPersistenceDto>({
  example: {
    text: 'hat',
    languageCode: 'clc',
    role: MultilingualTextItemRole.original,
  },
})
export class MultilingualTextItem extends Entity<MultilingualTextItemPersistenceDto> {
  text: string;
  languageCode: string;
  role: MultilingualTextItemRole;

  constructor({
    text,
    role,
    languageCode,
  }: {
    text: string;
    languageCode: string;
    role: MultilingualTextItemRole;
  }) {
    super();

    this.text = text;

    this.role = role;

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
      role: this.role,
    };
  }

  static fromPersistenceDto(
    { role, text, languageCode }: MultilingualTextItemPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): MultilingualTextItem | TrueImpactError {
    const instance = new MultilingualTextItem({
      role,
      text,
      languageCode,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
