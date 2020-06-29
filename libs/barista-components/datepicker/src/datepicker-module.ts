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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DtButtonModule } from '@dynatrace/barista-components/button';
import { DtDatePicker } from './datepicker';
import { DtCalendar } from './calendar';
import { OverlayModule } from '@angular/cdk/overlay';
import { DtCalendarBody } from './calendar-body';
import { DtIconModule } from '@dynatrace/barista-components/icon';
import { DtInputModule } from '@dynatrace/barista-components/input';
import { DtTimepicker } from './timepicker';
import { DtTimeinput } from './timeinput';

const COMPONENTS = [
  DtDatePicker,
  DtCalendar,
  DtCalendarBody,
  DtTimepicker,
  DtTimeinput,
];

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    DtButtonModule,
    DtIconModule,
    DtInputModule,
  ],
  exports: COMPONENTS,
  declarations: COMPONENTS,
})
export class DtDatepickerModule {}
