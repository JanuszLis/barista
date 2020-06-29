import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { isNumber, isString } from '@dynatrace/barista-components/core';
import { Subject } from 'rxjs';

export class DtTimeChangeEvent {
  get value(): string {
    return `${_valueTo2DigitString(this.hour)}:${_valueTo2DigitString(
      this.minute,
    )}`;
  }
  constructor(public hour: number, public minute: number) {}
}

@Component({
  selector: 'dt-timeinput',
  templateUrl: 'timeinput.html',
  styleUrls: ['timeinput.scss'],
  host: {
    class: 'dt-timeinput',
  },
  encapsulation: ViewEncapsulation.Emulated,
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DtTimeinput implements AfterViewInit, OnDestroy {
  @Input()
  get hour(): number | null {
    return this._hour;
  }
  set hour(value: number | null) {
    this._hour = _parseAndValidateInput(value, 0, 23, this._hour);
    this._tryUpdateInputElementValues();
    this._changeDetectorRef.markForCheck();
  }
  private _hour: number | null = null;

  @Input()
  get minute(): number | null {
    return this._minute;
  }
  set minute(value: number | null) {
    this._minute = _parseAndValidateInput(value, 0, 59, this._minute);
    this._tryUpdateInputElementValues();
    this._changeDetectorRef.markForCheck();
  }
  private _minute: number | null = null;

  timeChanges = new EventEmitter<DtTimeChangeEvent>();

  /** @internal */
  @ViewChild('hours', { read: ElementRef }) _hourInput: ElementRef<
    HTMLInputElement
  >;

  /** @internal */
  @ViewChild('minutes', { read: ElementRef }) _minuteInput: ElementRef<
    HTMLInputElement
  >;

  private _destroy$ = new Subject<void>();

  constructor(private _changeDetectorRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    // combineLatest(
    //   this._onInputChange(
    //     this._hourInput.nativeElement,
    //     0,
    //     23,
    //   ),
    //   filter((result) => {})
    //   this._handleAndValidateNumberInput(this._minuteInput.nativeElement, 0, 59),
    // )
    //   .pipe(takeUntil(this._destroy$))
    //   .subscribe(([[hourValue], [minuteValue]]) => {
    //     const event = new DtTimeChangeEvent(hourValue, minuteValue);
    //     console.log(event.value);
    //   });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  focus() {}

  // private _handleKeyup(nextToFocus?: HTMLInputElement): void {

  // }

  // private _onInputChange(
  //   element: HTMLInputElement,
  //   min: number,
  //   max: number,
  //   getFallbackValue: () => number | null
  // ): Observable<{ value: number | null, shouldFocusNext: boolean }> {
  //   return fromEvent(element, 'input').pipe(
  //     map(() => {
  //       const strintifiedValue = element.value;
  //       const value  = validateInput(parseInt(strintifiedValue, 10), min, max, getFallbackValue());
  //       const shouldFocusNext = value !== null && strintifiedValue.length >= 2;
  //       return { value, shouldFocusNext };
  //     })
  //   );
  // }

  private _tryUpdateInputElementValues() {
    if (this._hourInput) {
      this._hourInput.nativeElement.value =
        this._hour !== null ? this._hour.toString() : '';
    }
    if (this._minuteInput) {
      this._minuteInput.nativeElement.value =
        this._minute !== null ? this._minute.toString() : '';
    }
  }
}

const NUMBER_REGEX = /^\d+$/g;

/** @internal */
export function _parseAndValidateInput(
  value: any,
  min: number,
  max: number,
  fallbackValue: number | null,
): number | null {
  if (value == null) {
    return null;
  }

  if (isString(value) && NUMBER_REGEX.test(value)) {
    value = parseInt(value, 10);
  }

  if (isNumber(value) && value >= min && value <= max) {
    return value;
  }

  return isNumber(fallbackValue) ? fallbackValue : null;
}

/** @internal */
export function _valueTo2DigitString(value: number): string {
  return value < 10 ? `0${value}` : value.toString();
}
