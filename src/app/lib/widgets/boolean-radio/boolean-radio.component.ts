import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-boolean-radio',
  template: `
    <ng-template #controller>
      <div class="widget" [ngClass]="{'row': labelPosition === 'left', 'm-0' : true}">
        <lfb-label [title]="schema.title" [helpMessage]="schema.description" [ngClass]="labelWidthClass + ' pl-0 pr-1'"></lfb-label>

        <div ngbRadioGroup
             [attr.name]="name"
             [formControl]="control"
             class="btn-group form-check-inline btn-group-sm btn-group-toggle">
          <ng-container *ngFor="let option of ['No', 'Yes']" class="radio">
            <label ngbButtonLabel class="btn-outline-secondary m-0">
              <input ngbButton [value]="option === 'Yes'" type="radio" [attr.disabled]="schema.readOnly ? '' : null">
              {{option}}
            </label>
          </ng-container>
        </div>
      </div>
    </ng-template>

    <ng-container *ngTemplateOutlet="controller"></ng-container>
  `,
  styles: [
  ]
})
export class BooleanRadioComponent  extends LfbControlWidgetComponent implements OnInit {
  ngOnInit() {
    this.labelPosition = 'left';
    super.ngOnInit();
  }
}
