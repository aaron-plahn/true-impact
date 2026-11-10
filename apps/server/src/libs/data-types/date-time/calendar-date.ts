import { TrueImpactError } from '../error-handling';
import { NonNegativeInteger } from '../schema-management/decorators/non-negative-integer.decorator';
import { isInteger } from '../validation';

const intTo2DigitString = (input: number) => {
  if (!isInteger(input)) {
    return input;
  }

  if (input < 0) {
    return input;
  }

  if (input < 10) {
    return `0${input}`;
  }

  return `${input}`;
};

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
    return `${this.YYYY}-${intTo2DigitString(this.MM)}-${intTo2DigitString(this.DD)}`;
  }

  static fromDateString(dateString: string): CalendarDate | TrueImpactError {
    /**
     * It may be better to have an internal `Date` utility class given that
     * the recommended approach is to manually validate date strings in JS. This
     * really feels like it should just be on the native `Date` API, but that is
     * a legacy API.
     */
    const dateParts = dateString.split('-');

    if (dateParts.length !== 3) {
      return new TrueImpactError(
        `Invalid date format. Expected YYYY-MM-DD, but received ${dateParts.length} occurrences of "-".`,
      );
    }

    const [YYYY, MM, DD] = dateParts.map((part, index) => {
      try {
        return parseInt(part);
      } catch (_parseError) {
        let partLabel: string = 'Unsupported Part';

        if (index === 0) {
          partLabel = 'YYYY';
        }

        if (index === 1) {
          partLabel = 'MM';
        }

        if (index === 2) {
          partLabel = 'DD';
        }

        return new TrueImpactError(
          `Failed to parse ${partLabel} for a date. Invalid value: [${part}]`,
        );
      }
    });

    if (YYYY instanceof Error) {
      return YYYY;
    }

    // TODO We want to be the allowed range of dates to be configurable per use case.
    if (YYYY < 0 || YYYY > new Date().getFullYear()) {
      return new TrueImpactError(`Invalid year [${YYYY}] encountered in date.`);
    }

    if (MM instanceof Error) {
      return MM;
    }

    if (MM < 1 || MM > 12) {
      return new TrueImpactError(`Invalid month [${MM}] encountered in date.`);
    }

    if (DD instanceof Error) {
      return DD;
    }

    if (
      DD < 1 ||
      DD > 31 ||
      ([9, 4, 6, 11].includes(MM) && DD > 30) ||
      (MM === 2 && DD > 29)
    ) {
      return new TrueImpactError(
        `Encountered an invalid day [${DD}] / month [${MM}] combination in date.`,
      );
    }

    const isLeapYear = new Date(YYYY, 1, 29).getMonth() === 1;

    if (MM === 2 && !isLeapYear && DD > 28) {
      return new TrueImpactError(
        `Invalid date encountered. ${YYYY} is not a leap year.`,
      );
    }

    /**
     * We force the date to use the local time zone by appending noon.
     *
     * TODO We need to be careful about how we deal with time zone differences, server
     * time configuration, etc. before going to prod.
     */
    const date = new Date(`${dateString}T12:00:00`);

    return new CalendarDate({
      YYYY: date.getFullYear(),
      MM: date.getMonth() + 1,
      DD: date.getDate(),
    });
  }

  static fromPersitenceDto(dto: CalendarDateDto) {
    const instance = new CalendarDate(dto);

    return instance.validateInvariants();
  }
}
