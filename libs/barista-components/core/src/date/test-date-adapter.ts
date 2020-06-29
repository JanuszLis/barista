import { DtDateAdapter } from './date-adapter';

/** The default day of the week names to use if Intl API is not available. */
const DEFAULT_DAY_OF_WEEK_NAMES = {
  long: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

const DEFAULT_DATE_NAMES = fillArray(31, (i) => String(i + 1));

export class DtTestDateAdapter extends DtDateAdapter<Date> {
  constructor() {
    super();
    super.setLocale('en-US'); // Always 'en-US' for testing purpose
  }

  createDate(year: number, month: number, date: number) {
    // TODO: Check for overflows
    return new Date(year, month, date);
  }

  today(): Date {
    return new Date();
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getDate(date: Date): number {
    return date.getDate();
  }

  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getFirstDayOfWeek(): number {
    return 1; // Monday
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    return DEFAULT_DAY_OF_WEEK_NAMES[style];
  }

  getNumDaysInMonth(date: Date): number {
    return this.getDate(
      new Date(this.getYear(date), this.getMonth(date) + 1, 0),
    );
  }

  getDateNames(): string[] {
    return DEFAULT_DATE_NAMES;
  }

  format(date: Date, displayFormat: Object): string {
    displayFormat = { ...displayFormat, timeZone: 'utc' };
    const dtf = new Intl.DateTimeFormat(this.locale, displayFormat);
    console.log(dtf);
    return stripDirectionalityCharacters(formatDate(dtf, date));
  }

  isValid(date: Date) {
    return !isNaN(date.getTime());
  }

  isDateInstance(obj: any): obj is Date {
    return obj instanceof Date;
  }

  addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: Date, months: number): Date {
    let newDate = new Date(
      this.getYear(date),
      this.getMonth(date) + months,
      this.getDate(date),
    );

    // It's possible to wind up in the wrong month if the original month has more days than the new
    // month. In this case we want to go to the last day of the desired month.
    // Note: the additional + 12 % 12 ensures we end up with a positive number, since JS % doesn't
    // guarantee this.
    if (
      this.getMonth(newDate) !=
      (((this.getMonth(date) + months) % 12) + 12) % 12
    ) {
      newDate = new Date(this.getYear(newDate), this.getMonth(newDate), 0);
    }

    return newDate;
  }

  addCalendarDays(date: Date, days: number): Date {
    return new Date(
      this.getYear(date),
      this.getMonth(date),
      this.getDate(date) + days,
    );
  }
}

function fillArray<T>(length: number, fillFn: (index: number) => T) {
  return new Array(length).fill(null).map((_, i) => fillFn(i));
}

/**
 * Strip out unicode LTR and RTL characters. Edge and IE insert these into formatted dates while
 * other browsers do not. We remove them to make output consistent and because they interfere with
 * date parsing.
 */
function stripDirectionalityCharacters(str: string): string {
  return str.replace(/[\u200e\u200f]/g, '');
}

/**
 * When converting Date object to string, javascript built-in functions may return wrong
 * results because it applies its internal DST rules. The DST rules around the world change
 * very frequently, and the current valid rule is not always valid in previous years though.
 * We work around this problem building a new Date object which has its internal UTC
 * representation with the local date and time.
 */
function formatDate(dtf: Intl.DateTimeFormat, date: Date) {
  const d = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    ),
  );
  return dtf.format(d);
}
