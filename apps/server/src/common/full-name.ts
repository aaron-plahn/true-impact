import { NonEmptyString } from 'src/libs/data-types';

export class FullNameDto {
  @NonEmptyString({
    label: 'first name',
    description: `the person's first name`,
  })
  firstName: string;

  @NonEmptyString({
    label: 'middle name',
    description: `the person's middle name`,
  })
  middleName?: string;

  @NonEmptyString({
    label: 'last name',
    description: `the person's last name`,
  })
  lastName: string;
}

export class FullName {
  @NonEmptyString({
    label: 'first name',
    description: `the person's first name`,
  })
  firstName: string;

  @NonEmptyString({
    label: 'middle name',
    description: `the person's middle name`,
    // TODO this should show up as optional in swagger
    // TODO support many middle names
    isOptional: true,
  })
  middleName?: string;

  @NonEmptyString({
    label: 'last name',
    description: `the person's last name`,
  })
  lastName: string;

  constructor(dto: FullNameDto) {
    if (!dto) {
      return;
    }

    const { firstName, lastName, middleName } = dto;

    this.firstName = firstName;

    this.lastName = lastName;

    if (typeof middleName === 'string') {
      this.middleName = middleName;
    }
  }

  public getMiddleInitial(): string | undefined {
    if (this.middleName === null || typeof this.middleName === 'undefined') {
      return undefined;
    }

    if (this.middleName.length === 0) {
      return undefined;
    }

    return this.middleName.charAt(0);
  }

  toDto(): FullNameDto {
    return {
      firstName: this.firstName,
      middleName: this.middleName,
      lastName: this.lastName,
    };
  }

  toString() {
    return `${this.firstName} ${this.getMiddleInitial() || ''} ${this.lastName}`;
  }

  public static fromDto(dto: FullNameDto) {
    return new FullName(dto);
  }
}
