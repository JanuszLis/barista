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
  ViewChild,
  ElementRef,
  Optional,
  Inject,
  ChangeDetectorRef,
  Input,
  Self,
  Attribute,
} from '@angular/core';
import {
  mixinDisabled,
  mixinTabIndex,
  CanDisable,
  HasTabIndex,
  dtSetUiTestAttribute,
  DT_UI_TEST_CONFIG,
  DtUiTestConfiguration,
  mixinErrorState,
  ErrorStateMatcher,
  DtDateAdapter,
} from '@dynatrace/barista-components/core';
import { CdkConnectedOverlay } from '@angular/cdk/overlay';
import {
  trigger,
  state,
  style,
  transition,
  group,
  query,
  animate,
  animateChild,
} from '@angular/animations';
import {
  ControlValueAccessor,
  NgForm,
  FormGroupDirective,
  NgControl,
} from '@angular/forms';
import { DtCalendar } from './calendar';
import { getValidDateOrNull } from './util';

/**
 * This position config ensures that the top "start" corner of the overlay
 * is aligned with with the top "start" of the origin by default (overlapping
 * the trigger completely). If the panel cannot fit below the trigger, it
 * will fall back to a position above the trigger.
 */
const OVERLAY_POSITIONS = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
  },
  {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetX: 2,
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetX: 2,
  },
];

let uniqueId = 0;

// Boilerplate for applying mixins to DtDatePicker.
export class DtDatepickerBase {
  constructor(
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    public _parentForm: NgForm,
    public _parentFormGroup: FormGroupDirective,
    public ngControl: NgControl,
  ) {}
}
export const _DtDatepickerBase = mixinTabIndex(
  mixinDisabled(mixinErrorState(DtDatepickerBase)),
);

@Component({
  selector: 'dt-datepicker',
  templateUrl: 'datepicker.html',
  styleUrls: ['datepicker.scss'],
  host: {
    class: 'dt-datepicker',
    '[class.dt-select-invalid]': 'errorState',
    '[attr.id]': 'id',
    '[attr.aria-invalid]': 'errorState',
  },
  inputs: ['disabled', 'tabIndex'],
  encapsulation: ViewEncapsulation.Emulated,
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('transformPanel', [
      state(
        'void',
        style({
          transform: 'scaleY(0) translateX(-1px)',
          opacity: 0,
        }),
      ),
      state(
        'showing',
        style({
          opacity: 1,
          transform: 'scaleY(1) translateX(-1px)',
        }),
      ),
      transition(
        'void => *',
        group([
          query('@fadeInContent', animateChild()),
          animate('150ms cubic-bezier(0.25, 0.8, 0.25, 1)'),
        ]),
      ),
      transition('* => void', [
        animate('250ms 100ms linear', style({ opacity: 0 })),
      ]),
    ]),
    trigger('fadeInContent', [
      state('showing', style({ opacity: 1 })),
      transition('void => showing', [
        style({ opacity: 0 }),
        animate('150ms 100ms cubic-bezier(0.55, 0, 0.55, 0.2)'),
      ]),
    ]),
  ],
})
export class DtDatePicker<D> extends _DtDatepickerBase
  implements ControlValueAccessor, CanDisable, HasTabIndex {
  /** Unique id of the element. */
  @Input()
  get id(): string {
    return this._id;
  }
  set id(value: string) {
    this._id = value || this._uid;
    this.stateChanges.next();
  }
  private _id: string;
  private _uid = `dt-select-${uniqueId++}`;

  /** Value of the select control. */
  @Input()
  get value(): D | null {
    return this._value;
  }
  set value(newValue: D | null) {
    if (newValue !== this._value) {
      this._value = newValue;
      this._changeDetectorRef.markForCheck();
    }
  }
  private _value: D | null = null;

  /** The date to open the calendar to initially. */
  @Input()
  get startAt(): D | null {
    return this._startAt || this._value;
  }
  set startAt(value: D | null) {
    this._startAt = getValidDateOrNull(this._dateAdapter, value);
  }
  private _startAt: D | null;

  /** Object used to control when error messages are shown. */
  @Input() errorStateMatcher: ErrorStateMatcher;

  /** Classes to be passed to the select panel. Supports the same syntax as `ngClass`. */
  // tslint:disable-next-line:no-any
  @Input() panelClass: string | string[] | Set<string> | { [key: string]: any };

  /** Whether or not the overlay panel is open. */
  get panelOpen(): boolean {
    return this._panelOpen;
  }
  private _panelOpen = false;

  /** Overlay pane containing the options. */
  @ViewChild(CdkConnectedOverlay) _overlayDir: CdkConnectedOverlay;

  @ViewChild(DtCalendar) _calendar: DtCalendar<D>;

  /** @internal Defines the positions the overlay can take relative to the button element. */
  _positions = OVERLAY_POSITIONS;

  /** @internal Whether the panel's animation is done. */
  _panelDoneAnimating = false;

  /** @internal `View -> model callback called when value changes` */
  _onChange: (value: Date) => void = () => {};

  /** @internal `View -> model callback called when select has been touched` */
  _onTouched = () => {};

  // REMOVE!!!!!
  _valueLabel = '';

  constructor(
    private _dateAdapter: DtDateAdapter<D>,
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _elementRef: ElementRef,
    readonly defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() readonly parentForm: NgForm,
    @Optional() readonly parentFormGroup: FormGroupDirective,
    @Self() @Optional() readonly ngControl: NgControl,
    @Attribute('tabindex') tabIndex: string,
    @Optional()
    @Inject(DT_UI_TEST_CONFIG)
    private readonly _config?: DtUiTestConfiguration,
  ) {
    super(defaultErrorStateMatcher, parentForm, parentFormGroup, ngControl);

    this.tabIndex = parseInt(tabIndex, 10) || 0;

    // Force setter to be called in case id was not specified.
    this.id = this.id;
  }

  /** Opens or closes the overlay panel. */
  toggle(): void {
    if (this.panelOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /** Opens the overlay panel. */
  open(): void {
    if (!this.disabled && !this._panelOpen) {
      this._panelOpen = true;
      this._changeDetectorRef.markForCheck();
    }
  }

  /** Closes the overlay panel and focuses the host element. */
  close(): void {
    if (this._panelOpen) {
      this._panelOpen = false;
      this._changeDetectorRef.markForCheck();
    }
  }

  /** Sets the select's value. Part of the ControlValueAccessor. */
  writeValue(value: D): void {
    this.value = value;
  }

  /**
   * Saves a callback function to be invoked when the select's value
   * changes from user input. Part of the ControlValueAccessor.
   */
  registerOnChange(fn: (value: Date) => void): void {
    this._onChange = fn;
  }

  /**
   * Saves a callback function to be invoked when the select is blurred
   * by the user. Part of the ControlValueAccessor.
   */
  registerOnTouched(fn: () => {}): void {
    this._onTouched = fn;
  }

  /** Disables the select. Part of the ControlValueAccessor. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this._changeDetectorRef.markForCheck();
    this.stateChanges.next();
  }

  /** @internal Callback that is invoked when the overlay panel has been attached. */
  _onAttached(): void {
    dtSetUiTestAttribute(
      this._overlayDir.overlayRef.overlayElement,
      this._overlayDir.overlayRef.overlayElement.id,
      this._elementRef,
      this._config,
    );
  }

  /**
   * @internal
   * When the panel content is done fading in, the _panelDoneAnimating property is
   * set so the proper class can be added to the panel.
   */
  _onFadeInDone(): void {
    this._panelDoneAnimating = this.panelOpen;
    if (this.panelOpen) {
      this._calendar.focus();
    }
    this._changeDetectorRef.markForCheck();
  }

  _handleKeydown(): void {}

  _setSelectedValue(value: D) {
    this._value = value;
    this._valueLabel = value
      ? this._dateAdapter.format(value, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        })
      : '';
    this._changeDetectorRef.markForCheck();
  }
}
