import { Month } from './month.enum';

export class CalendarDateDto {
  month: Month;

  day: number;

  year: number;
}

export class CalendarDate {
  readonly month: Month;

  readonly day: number;

  readonly year: number;

  constructor(dto: CalendarDateDto) {
    if (!dto) {
      return;
    }

    const { month, day, year } = dto;

    this.month = month;

    this.day = day;

    this.year = year;
  }

  // TODO extend entity and use `validateInvariants`
  validateSchema() {}
}
