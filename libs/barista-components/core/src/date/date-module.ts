import { NgModule } from '@angular/core';
import { DtDateAdapter } from './date-adapter';
import { DtTestDateAdapter } from './test-date-adapter';

@NgModule({
  providers: [{ provide: DtDateAdapter, useClass: DtTestDateAdapter }],
})
export class DtTestDateModule {}
