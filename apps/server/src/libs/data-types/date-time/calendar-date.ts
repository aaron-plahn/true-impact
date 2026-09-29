import { TrueImpactError } from '../error-handling';
import { NonNegativeInteger } from '../schema-management/decorators/non-negative-integer.decorator';

export class CalendarDateDto {
  @NonNegativeInteger({
    label: 'year',
    description: 'calendar year in the format YYYY',
  })
  readonly YYYY: number;

  @NonNegativeInteger({
    label: 'month',
    description: 'calendar month in the format MM',
  })
  readonly MM: number;

  @NonNegativeInteger({
    label: 'day',
    description: 'calendar day in the format DD',
  })
  readonly DD: number;
}

/**
 * The `Date` API is a messy legacy JS API. This class
 * provides a facade around the complexity.
 */
export class CalendarDate {
  @NonNegativeInteger({
    label: 'year',
    description: 'calendar year in the format YYYY',
  })
  readonly YYYY: number;

  @NonNegativeInteger({
    label: 'month',
    description: 'calendar month in the format MM',
  })
  readonly MM: number;

  @NonNegativeInteger({
    label: 'day',
    description: 'calendar day in the format DD',
  })
  readonly DD: number;

  constructor({ YYYY, MM, DD }: { YYYY: number; MM: number; DD: number }) {
    this.YYYY = YYYY;

    this.MM = MM;

    this.DD = DD;
  }

  validateInvariants(): CalendarDate | TrueImpactError {
    // TODO implement this!
    return this;
  }

  // TODO toIsoString
  toDateString() {
    return `${this.YYYY}-${this.MM}-${this.DD}`;
  }

  static fromDateString(dateString: string): CalendarDate | TrueImpactError {
    const date = new Date(dateString);

    // TODO validation + unit test
    return new CalendarDate({
      YYYY: date.getFullYear(),
      MM: date.getMonth(),
      DD: date.getDay(),
    });
  }

  static fromPersitenceDto(dto: CalendarDateDto) {
    const instance = new CalendarDate(dto);

    return instance.validateInvariants();
  }
}
