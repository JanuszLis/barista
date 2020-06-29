import {
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import { DtInput } from '@dynatrace/barista-components/input';

@Component({
  selector: 'dt-timepicker',
  templateUrl: 'timepicker.html',
  styleUrls: ['timepicker.scss'],
  host: {
    class: 'dt-timepicker',
  },
  encapsulation: ViewEncapsulation.Emulated,
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DtTimepicker {
  @ViewChild('start', { read: DtInput }) startTimeInput: DtInput;
  @ViewChild('end', { read: DtInput }) endTimeInput: DtInput;
}
