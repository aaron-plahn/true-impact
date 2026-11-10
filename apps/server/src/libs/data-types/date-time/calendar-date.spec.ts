import { TrueImpactError } from '../../data-types/error-handling';
import { CalendarDate } from './calendar-date';

const assertDateError = ({
  input,
  description,
  mode,
  checkMessage,
}: {
  input: string;
  description: string;
  checkMessage?: (message: string) => void;
  mode?: 'only' | 'skip';
}) => {
  let testRunner = it;

  if (mode === 'only') {
    testRunner = it.only;
  } else if (mode === 'skip') {
    testRunner = it.skip;
  }

  describe(`when the date is invalid: ${input} (${description})`, () => {
    testRunner(`should return the expected error`, () => {
      const result = CalendarDate.fromDateString(input);

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      if (typeof checkMessage === 'function') {
        checkMessage(message);
      }
    });
  });
};

const assertValidDate = ({
  input,
  mode,
  description,
}: {
  input: string;
  description?: string;
  mode?: 'skip' | 'only';
}) => {
  let testRunner = it;

  if (mode === 'skip') {
    testRunner = it.skip;
  }

  if (mode === 'only') {
    testRunner = it.only;
  }

  describe(`valid value: [${input}], ${description || ''}`, () => {
    testRunner(`should return the expected date`, () => {
      const result = CalendarDate.fromDateString(input);

      expect(result).not.toBeInstanceOf(Error);

      // We ensure the date string "comes out the other side" to ensure all parsing was correct
      expect((result as CalendarDate).toDateString()).toEqual(input);
    });
  });
};

describe(`CalendarDate`, () => {
  describe(`fromDateString`, () => {
    describe(`when the date is valid`, () => {
      assertValidDate({
        input: '2026-01-01',
        description: 'First day of the year',
      });

      assertValidDate({
        input: '2020-01-31',
        description: 'last day of January',
      });

      assertValidDate({
        input: '2016-02-28',
        description: 'last day before magic leap year day',
      });

      assertValidDate({
        input: '1992-02-29',
        description: 'magic leap year day',
      });

      assertValidDate({
        input: '1976-12-31',
        description: 'last day of the year',
      });

      assertValidDate({
        input: '2020-03-31',
        description: 'last day of March',
      });

      assertValidDate({
        input: '2020-04-30',
        description: 'last day of April',
      });

      assertValidDate({
        input: '2020-05-31',
        description: 'last day of May',
      });

      assertValidDate({
        input: '2020-06-30',
        description: 'last day of June',
      });

      assertValidDate({
        input: '2020-07-31',
        description: 'last day of July',
      });

      assertValidDate({
        input: '2020-05-31',
        description: 'last day of August',
      });

      assertValidDate({
        input: '2020-09-30',
        description: 'last day of September',
      });

      assertValidDate({
        input: '2020-10-31',
        // Happy Halloween!
        description: 'last day of October',
      });

      assertValidDate({
        input: '2020-11-30',
        description: 'last day of November',
      });

      assertValidDate({
        input: '2020-12-31',
        description: 'last day of December',
      });
    });

    describe(`when the date is invalid`, () => {
      assertDateError({
        input: '2017-01-32',
        description: 'date too large for a 31 day month',
        checkMessage: (message) => {
          expect(message).toContain(`invalid day`);

          expect(message).toContain('32');

          expect(message).toContain('1');
        },
      });

      assertDateError({
        input: '1966-04-31',
        description: '31st day in a 30 day month (April)',
        checkMessage: (message) => {
          expect(message).toContain(`invalid day`);

          expect(message).toContain('31');

          expect(message).toContain('4');
        },
      });

      assertDateError({
        input: '1994-06-31',
        description: '31st day in a 30 day month (June)',
        checkMessage: (message) => {
          expect(message).toContain('invalid day');

          expect(message).toContain('31');

          expect(message).toContain('6');
        },
      });

      assertDateError({
        input: '2001-09-31',
        description: '31st day in a 30 month day (September)',
        checkMessage: (message) => {
          expect(message).toContain('invalid day');

          expect(message).toContain('31');

          expect(message).toContain('9');
        },
      });

      assertDateError({
        input: '2010-11-31',
        description: '31st day in a 30 day month (November)',
        checkMessage: (message) => {
          expect(message).toContain('invalid day');

          expect(message).toContain('31');

          expect(message).toContain('11');
        },
      });

      assertDateError({
        input: '2014-02-29',
        description: '29th day in February in a non leap year',

        checkMessage: (message) => {
          expect(message).toContain('2014');

          expect(message).toContain('not a leap year');
        },
      });

      assertDateError({
        input: '2012-02-30',
        description: 'the 30th day in February in a leap year',
        checkMessage: (message) => {
          expect(message).toContain('invalid day');

          expect(message).toContain('30');

          expect(message).toContain('2');
        },
      });

      assertDateError({
        input: '2004-01-00',
        description: '0th day',
        checkMessage: (message) => {
          expect(message).toContain('invalid day');

          expect(message).toContain('month [1]');

          expect(message).toContain('day [0]');
        },
      });
    });
  });
});
