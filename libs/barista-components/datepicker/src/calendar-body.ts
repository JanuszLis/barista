/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  DtDateAdapter,
  _readKeyCode,
} from '@dynatrace/barista-components/core';
import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  ElementRef,
} from '@angular/core';
import { getValidDateOrNull } from './util';
import {
  UP_ARROW,
  DOWN_ARROW,
  LEFT_ARROW,
  RIGHT_ARROW,
  ENTER,
  SPACE,
  PAGE_UP,
  PAGE_DOWN,
} from '@angular/cdk/keycodes';

const DAYS_PER_WEEK = 7;

interface DtCalendarCell<D> {
  displayValue: string;
  value: number;
  rawValue: D;
  ariaLabel: string;
}

@Component({
  selector: 'dt-calendar-body',
  templateUrl: 'calendar-body.html',
  styleUrls: ['calendar-body.scss'],
  host: {
    class: 'dt-calendar-body',
    tabIndex: '0',
    '(keyup)': '_onHostKeyup($event)',
  },
  encapsulation: ViewEncapsulation.Emulated,
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DtCalendarBody<D> {
  /**
   * The date to display in this month view
   * (everything other than the month and year is ignored).
   */
  @Input()
  get activeDate(): D {
    return this._activeDate;
  }
  set activeDate(value: D) {
    const validDate =
      getValidDateOrNull(this._dateAdapter, value) || this._dateAdapter.today();
    this._activeDate = this._dateAdapter.clampDate(
      validDate,
      this.minDate,
      this.maxDate,
    );
    this._init();
    console.log(value);
  }
  private _activeDate: D;

  /** The currently selected date. */
  @Input()
  get selected(): D | null {
    return this._selected;
  }
  set selected(value: D | null) {
    this._selected = getValidDateOrNull(this._dateAdapter, value);
  }
  private _selected: D | null = null;

  /** The minimum selectable date. */
  @Input()
  get minDate(): D | null {
    return this._minDate;
  }
  set minDate(value: D | null) {
    this._minDate = getValidDateOrNull(this._dateAdapter, value);
  }
  private _minDate: D | null = null;

  /** The maximum selectable date. */
  @Input()
  get maxDate(): D | null {
    return this._maxDate;
  }
  set maxDate(value: D | null) {
    this._maxDate = getValidDateOrNull(this._dateAdapter, value);
  }
  private _maxDate: D | null = null;

  /** Function used to filter whether a date is selectable or not. */
  @Input() dateFilter: (date: D) => boolean;

  /** Emits when a new value is selected. */
  @Output() readonly selectedChange = new EventEmitter<D>();

  /** Emits when any date is activated. */
  @Output() readonly activeDateChange = new EventEmitter<D>();

  /** The names of the weekdays. */
  _weekdays: { long: string; short: string }[];

  /** Grid of calendar cells representing the dates of the month. */
  _weeks: DtCalendarCell<D>[][];

  /** The number of blank cells to put at the beginning for the first row. */
  _firstRowOffset: number;

  constructor(
    private _dateAdapter: DtDateAdapter<D>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _elementRef: ElementRef<HTMLElement>,
  ) {
    this._activeDate = this._dateAdapter.today();
  }

  focus(): void {
    this._elementRef.nativeElement.focus();
  }

  /** Checks whether the provided date cell has the same value as the provided compare value. */
  _isSame(cell: DtCalendarCell<D>, compareValue: D): boolean {
    return (
      compareValue !== null &&
      cell.rawValue !== null &&
      this._dateAdapter.compareDate(cell.rawValue, compareValue) === 0
    );
  }

  _cellClicked(cell: DtCalendarCell<D>): void {
    this._setActiveDateAndEmit(cell.rawValue);
    this._selectActiveDate();
    this._changeDetectorRef.markForCheck();
  }

  _onHostKeyup(event: KeyboardEvent): void {
    const keyCode = _readKeyCode(event);

    switch (keyCode) {
      case UP_ARROW:
        // Goto previous week
        this._setActiveDateAndEmit(
          this._dateAdapter.addCalendarDays(this._activeDate, -7),
        );
        break;
      case DOWN_ARROW:
        // Goto next week
        this._setActiveDateAndEmit(
          this._dateAdapter.addCalendarDays(this._activeDate, 7),
        );
        break;
      case LEFT_ARROW:
        // Goto previous day
        this._setActiveDateAndEmit(
          this._dateAdapter.addCalendarDays(this._activeDate, -1),
        );
        break;
      case RIGHT_ARROW:
        // Goto next day
        this._setActiveDateAndEmit(
          this._dateAdapter.addCalendarDays(this._activeDate, 1),
        );
        break;
      case PAGE_UP:
        // Goto previous month. If ALT key is pressed goto previous year instead
        this._setActiveDateAndEmit(
          event.altKey
            ? this._dateAdapter.addCalendarYears(this._activeDate, -1)
            : this._dateAdapter.addCalendarMonths(this._activeDate, -1),
        );
        break;
      case PAGE_DOWN:
        // Goto next month. If ALT key is pressed goto next year instead
        this._setActiveDateAndEmit(
          event.altKey
            ? this._dateAdapter.addCalendarYears(this._activeDate, 1)
            : this._dateAdapter.addCalendarMonths(this._activeDate, 1),
        );
        break;
      case ENTER:
      case SPACE:
        // Select the active date
        this._selectActiveDate();
        break;
    }

    // Prevent unexpected default actions such as form submission.
    event.preventDefault();

    this._changeDetectorRef.markForCheck();
  }

  private _init(): void {
    this._initWeekdays();
    this._initWeeks();

    this._changeDetectorRef.markForCheck();
  }

  private _initWeekdays(): void {
    const firstDayOfWeek = this._dateAdapter.getFirstDayOfWeek();
    const shortWeekdays = this._dateAdapter.getDayOfWeekNames('short');
    const longWeekdays = this._dateAdapter.getDayOfWeekNames('long');

    const weekdays = longWeekdays.map((long, i) => ({
      long,
      short: shortWeekdays[i],
    }));
    this._weekdays = weekdays
      .slice(firstDayOfWeek)
      .concat(weekdays.slice(0, firstDayOfWeek));
  }

  private _initWeeks(): void {
    const daysInMonth = this._dateAdapter.getNumDaysInMonth(this.activeDate);
    const dateNames = this._dateAdapter.getDateNames();
    const firstOfMonth = this._dateAdapter.createDate(
      this._dateAdapter.getYear(this.activeDate),
      this._dateAdapter.getMonth(this.activeDate),
      1,
    );
    const firstWeekOffset =
      (DAYS_PER_WEEK +
        this._dateAdapter.getDayOfWeek(firstOfMonth) -
        this._dateAdapter.getFirstDayOfWeek()) %
      DAYS_PER_WEEK;

    let weeks: DtCalendarCell<D>[][] = [[]];
    for (let i = 0, cell = firstWeekOffset; i < daysInMonth; i++, cell++) {
      if (cell == DAYS_PER_WEEK) {
        weeks.push([]);
        cell = 0;
      }
      const date = this._dateAdapter.createDate(
        this._dateAdapter.getYear(this.activeDate),
        this._dateAdapter.getMonth(this.activeDate),
        i + 1,
      );

      weeks[weeks.length - 1].push({
        value: i + 1,
        displayValue: dateNames[i],
        rawValue: date,
        ariaLabel: this._dateAdapter.format(date, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      });
    }
    this._weeks = weeks;
    this._firstRowOffset =
      weeks && weeks.length && weeks[0].length
        ? DAYS_PER_WEEK - weeks[0].length
        : 0;
  }

  private _selectActiveDate(): void {
    if (!this.dateFilter || this.dateFilter(this._activeDate)) {
      this.selectedChange.emit(this._activeDate);
    }
  }

  private _setActiveDateAndEmit(date: D): void {
    if (this._dateAdapter.compareDate(date, this.activeDate)) {
      this._activeDate = date;
      this.activeDateChange.emit(this.activeDate);
    }
  }
}
