import { Component } from '@angular/core';
import { OriginalClassName } from '../../../core/decorators';
import { DtOverlayConfig } from '@dynatrace/angular-components/overlay';

@Component({
  moduleId: module.id,
  template: `
  <span [dtOverlay]="overlay" style="cursor: pointer;" [dtOverlayConfig]="config">Hover me</span>
  <ng-template #overlay>
    <p>Overlay content</p>
  </ng-template>
  `,
})
@OriginalClassName('DefaultOverlayExampleComponent')
export class DefaultOverlayExampleComponent {
  config: DtOverlayConfig = {
    pinnable: true,
    verticalAnchor: 'center',
  };
}
