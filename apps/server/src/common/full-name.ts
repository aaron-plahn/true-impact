export type FullNameDto = {
  firstName: string;

  middleName?: string;

  lastName: string;
};

export class FullName {
  firstName: string;

  middleName?: string;

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

  toString() {
    return `${this.firstName} ${this.getMiddleInitial()} ${this.lastName}`;
  }

  public static fromDto(dto: FullNameDto) {
    return new FullName(dto);
  }
}
