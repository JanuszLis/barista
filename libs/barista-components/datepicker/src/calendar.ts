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
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  AfterContentInit,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { DtDateAdapter } from '@dynatrace/barista-components/core';
import { getValidDateOrNull } from './util';
import { DtCalendarBody } from './calendar-body';

@Component({
  selector: 'dt-calendar',
  templateUrl: 'calendar.html',
  styleUrls: ['calendar.scss'],
  host: {
    class: 'dt-calendar',
  },
  encapsulation: ViewEncapsulation.Emulated,
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DtCalendar<D> implements AfterContentInit {
  /** A date representing the period (month or year) to start the calendar in. */
  @Input()
  get startAt(): D | null {
    return this._startAt;
  }
  set startAt(value: D | null) {
    this._startAt = getValidDateOrNull(this._dateAdapter, value);
  }
  private _startAt: D | null = null;

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

  /** Emits when the currently selected date changes. */
  @Output() readonly selectedChange = new EventEmitter<D>();

  get activeDate(): D {
    return this._activeDate;
  }
  set activeDate(value: D) {
    this._activeDate = this._dateAdapter.clampDate(
      value,
      this.minDate,
      this.maxDate,
    );
    this._label = this._dateAdapter.format(value, {
      year: 'numeric',
      month: 'short',
    });
    this._changeDetectorRef.markForCheck();
  }
  private _activeDate: D;

  _label = '';

  @ViewChild(DtCalendarBody) _calendarBody: DtCalendarBody<D>;

  constructor(
    private _dateAdapter: DtDateAdapter<D>,
    private _changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngAfterContentInit() {
    this.activeDate = this.startAt || this._dateAdapter.today();
  }

  focus(): void {
    if (this._calendarBody) {
      this._calendarBody.focus();
    }
  }

  _addMonths(months: number): void {
    this.activeDate = this._dateAdapter.addCalendarMonths(
      this.activeDate,
      months,
    );
    this._changeDetectorRef.markForCheck();
  }

  _selectedValueChanged(value: D) {
    this.selectedChange.emit(value);
  }
}
