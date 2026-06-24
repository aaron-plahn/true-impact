import { NonEmptyString } from '../libs/data-types';

export class FullNameDto {
  @NonEmptyString({
    label: 'first name',
    description: `the person's first name`,
  })
  firstName: string;

  @NonEmptyString({
    label: 'middle name',
    description: `the person's middle name(s)`,
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  middleNames: string[];

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

  // TODO all optional properties should show up as such in Swagger
  @NonEmptyString({
    label: 'middle name',
    description: `a list of the person's middle names, if any`,
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  middleNames: string[];

  @NonEmptyString({
    label: 'last name',
    description: `the person's last name`,
  })
  lastName: string;

  constructor(dto: FullNameDto) {
    if (!dto) {
      return;
    }

    const { firstName, lastName, middleNames: middleName } = dto;

    this.firstName = firstName;

    this.lastName = lastName;

    if (typeof middleName === 'string') {
      this.middleNames = middleName;
    } else {
      this.middleNames = [];
    }
  }

  public getMiddleInitial(): string | undefined {
    if (this.middleNames === null || typeof this.middleNames === 'undefined') {
      return undefined;
    }

    if (this.middleNames.length === 0) {
      return undefined;
    }

    const primaryMiddleName = this.middleNames[0];

    if (primaryMiddleName.length === 0) {
      return undefined;
    }

    return primaryMiddleName.charAt(0);
  }

  toDto(): FullNameDto {
    return {
      firstName: this.firstName,
      middleNames: this.middleNames,
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
