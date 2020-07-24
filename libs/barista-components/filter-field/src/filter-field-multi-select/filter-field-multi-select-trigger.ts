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

import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ESCAPE, UP_ARROW } from '@angular/cdk/keycodes';
import {
  Overlay,
  OverlayConfig,
  OverlayRef,
  PositionStrategy,
  ViewportRuler,
  OverlayContainer,
} from '@angular/cdk/overlay';
import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  Inject,
} from '@angular/core';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  fromEvent,
  merge,
  of as observableOf,
} from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import {
  _readKeyCode,
  DtFlexibleConnectedPositionStrategy,
} from '@dynatrace/barista-components/core';

import { DtFilterFieldMultiSelect } from './filter-field-multi-select';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: `input[dtFilterFieldMultiSelect]`,
  exportAs: 'dtFilterFieldMultiSelectTrigger',
  host: {
    '(focusin)': '_handleFocus()',
    '[attr.aria-expanded]': 'multiSelectDisabled ? null : panelOpen.toString()',
    '[attr.aria-owns]':
      '(multiSelectDisabled || !panelOpen) ? null : multiSelect?.id',
  },
})
export class DtFilterFieldMultiSelectTrigger implements OnDestroy {
  /** The filter-field multiSelect panel to be attached to this trigger. */
  @Input('dtFilterFieldMultiSelect')
  get multiSelect(): DtFilterFieldMultiSelect {
    return this._multiSelect;
  }
  set multiSelect(value: DtFilterFieldMultiSelect) {
    this._multiSelect = value;
    this._detachOverlay();
  }
  private _multiSelect: DtFilterFieldMultiSelect;

  /**
   * Whether the autocomplete is disabled. When disabled, the element will
   * act as a regular input and the user won't be able to open the panel.
   */
  @Input('dtFilterFieldMultiSelectDisabled')
  get multiSelectDisabled(): boolean {
    return this._multiSelectDisabled;
  }
  set multiSelectDisabled(value: boolean) {
    this._multiSelectDisabled = coerceBooleanProperty(value);
  }
  private _multiSelectDisabled = false;

  /** Whether or not the filter-field multiSelect panel is open. */
  get panelOpen(): boolean {
    return (
      !!(this._overlayRef && this._overlayRef.hasAttached()) &&
      this._multiSelect.isOpen
    );
  }

  /**
   * A stream of actions that should close the autocomplete panel, including
   * when an option is selected, on blur, and when TAB is pressed.
   */
  get panelClosingActions(): Observable<null> {
    return merge(
      this._closeKeyEventStream,
      this._getOutsideClickStream(),
      this._overlayRef
        ? this._overlayRef
            .detachments()
            .pipe(
              filter(
                () => !!(this._overlayRef && this._overlayRef.hasAttached()),
              ),
            )
        : observableOf(),
    ).pipe(map(() => null));
  }

  /** Stream of keyboard events that can close the panel. */
  private readonly _closeKeyEventStream = new Subject<void>();

  /** Overlay Reference of the currently open overlay */
  private _overlayRef: OverlayRef | null;

  /**
   * Strategy that is used to position the panel.
   */
  private _positionStrategy: DtFlexibleConnectedPositionStrategy;

  /** Whether the component has already been destroyed */
  private _componentDestroyed = false;

  /** The subscription for closing actions (some are bound to document). */
  private _closingActionsSubscription = EMPTY.subscribe();

  /** The subscription for the window blur event */
  private _windowBlurSubscription = EMPTY.subscribe();

  /**
   * Whether the autocomplete can open the next time it is focused. Used to prevent a focused,
   * closed autocomplete from being reopened if the user switches to another browser tab and then
   * comes back.
   */
  private _canOpenOnNextFocus = true;

  constructor(
    private _elementRef: ElementRef,
    private _overlay: Overlay,
    private _changeDetectorRef: ChangeDetectorRef,
    private _viewportRuler: ViewportRuler,
    private _platform: Platform,
    private _overlayContainer: OverlayContainer,
    zone: NgZone,
    // tslint:disable-next-line:no-any
    @Inject(DOCUMENT) private _document: any,
  ) {
    // tslint:disable-next-line:strict-type-predicates
    if (typeof window !== 'undefined') {
      zone.runOutsideAngular(() => {
        this._windowBlurSubscription = fromEvent(window, 'blur').subscribe(
          () => {
            // If the user blurred the window while the autocomplete is focused, it means that it'll be
            // refocused when they come back. In this case we want to skip the first focus event, if the
            // pane was closed, in order to avoid reopening it unintentionally.
            this._canOpenOnNextFocus =
              document.activeElement !== this._elementRef.nativeElement ||
              this.panelOpen;
          },
        );
      });
    }
  }

  ngOnDestroy(): void {
    this._closingActionsSubscription.unsubscribe();
    this._windowBlurSubscription.unsubscribe();
    this._componentDestroyed = true;
    this._destroyPanel();
    this._closeKeyEventStream.complete();
  }

  /** Opens the filter-field multiSelect panel. */
  openPanel(): void {
    if (this._multiSelect) {
      this._attachOverlay();
    }
    this._multiSelect._initialSelection = [];
  }

  /** Closes the filter-field multiSelect panel. */
  closePanel(shouldEmit: boolean = true): void {
    if (this._overlayRef && !this._overlayRef.hasAttached()) {
      return;
    }

    if (this.panelOpen && shouldEmit) {
      // Only emit if the panel was visible.
      this.multiSelect.closed.emit();
    }

    // Note that in some cases this can end up being called after the component is destroyed.
    // Add a check to ensure that we don't try to run change detection on a destroyed view.
    if (!this._componentDestroyed) {
      this.multiSelect._isOpen = false;
      this._detachOverlay();
      // We need to trigger change detection manually, because
      // `fromEvent` doesn't seem to do it at the proper time.
      // This ensures that the label is reset when the
      // user clicks outside.
      this._changeDetectorRef.detectChanges();
    }
  }

  /** @internal Handles the focussing of the filter-field-multiSelect. */
  _handleFocus(): void {
    if (!this._canOpenOnNextFocus) {
      this._canOpenOnNextFocus = true;
    } else if (this._canOpen()) {
      this.openPanel();
    }
  }

  /** Determines whether the panel can be opened. */
  private _canOpen(): boolean {
    const element = this._elementRef.nativeElement;
    return !element.readOnly && !element.disabled && !this._multiSelectDisabled;
  }

  /** Attach the filter-field-multiSelect overlay. */
  private _attachOverlay(): void {
    if (!this._overlayRef) {
      this._overlayRef = this._overlay.create(this._getOverlayConfig());
      this._overlayRef.keydownEvents().subscribe((event) => {
        const keyCode = _readKeyCode(event);
        // Close when pressing ESCAPE or ALT + UP_ARROW, based on the a11y guidelines.
        // See: https://www.w3.org/TR/wai-aria-practices-1.1/#textbox-keyboard-interaction
        if (keyCode === ESCAPE || (keyCode === UP_ARROW && event.altKey)) {
          this._closeKeyEventStream.next();
        }
      });
    }
    if (this._overlayRef && !this._overlayRef.hasAttached()) {
      this._overlayRef.attach(this._multiSelect._portal);
      this._closingActionsSubscription = this._subscribeToClosingActions();
    }

    this.multiSelect._isOpen = this._overlayRef.hasAttached();
    this.multiSelect.opened.emit();

    if (this.panelOpen) {
      this._overlayRef.updatePosition();
    }

    this.multiSelect._markForCheck();
    this._changeDetectorRef.detectChanges();
  }

  /** Detach the filter-field-multiSelect overlay */
  private _detachOverlay(): void {
    if (this._overlayRef) {
      this._overlayRef.detach();
    }
  }

  /** Destroys the filter-field multiSelect suggestion panel. */
  private _destroyPanel(): void {
    if (this._overlayRef) {
      this.closePanel();
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
  }

  /** Returns the overlay configuration for the filter-field-multiSelect. */
  private _getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPosition(),
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
    });
  }

  /** Returns the overlay position. */
  private _getOverlayPosition(): PositionStrategy {
    this._positionStrategy = new DtFlexibleConnectedPositionStrategy(
      this._elementRef,
      this._viewportRuler,
      this._document,
      this._platform,
      this._overlayContainer,
    )
      .withFlexibleDimensions(false)
      .withPush(false)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      ]);

    return this._positionStrategy;
  }

  /**
   * This method listens to a stream of panel closing actions and resets the
   * stream every time the option list changes.
   */
  private _subscribeToClosingActions(): Subscription {
    return (
      this.panelClosingActions
        .pipe(take(1))
        // set the value, close the panel, and complete.
        .subscribe(() => {
          // this._setValueAndClose(event);
          this.closePanel();
        })
    );
  }

  /** Stream of clicks outside of the autocomplete panel. */
  // tslint:disable-next-line:no-any
  private _getOutsideClickStream(): Observable<Event | null> {
    if (!document) {
      return observableOf(null);
    }

    return merge(
      fromEvent<MouseEvent>(document, 'click'),
      fromEvent<TouchEvent>(document, 'touchend'),
    ).pipe(
      filter((event: Event) => {
        const clickTarget = event.target as HTMLElement;

        return (
          !!(this._overlayRef && this._overlayRef.hasAttached()) &&
          clickTarget !== this._elementRef.nativeElement &&
          !!this._overlayRef &&
          !this._overlayRef.overlayElement.contains(clickTarget)
        );
      }),
    );
  }
}