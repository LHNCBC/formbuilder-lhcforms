/**
 * Customize layout of integer component from ngx-schema-form.
 */
import { Component } from '@angular/core';

import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-integer-widget',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           name="{{name}}" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        <lfb-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass + ' ps-0 pe-1'"
        ></lfb-label>
	      <input lfbInteger [attr.readonly]="schema.readOnly?true:null" name="{{name}}"
	        [attr.id]="id"
	        class="form-control {{controlWidthClass}}" [formControl]="control"
	        type="number" [attr.min]="schema.minimum" [attr.max]="schema.maximum"
	        [attr.placeholder]="schema.placeholder"
	        [attr.maxLength]="schema.maxLength || null"
          [attr.minLength]="schema.minLength || null">
      </div>
    </ng-template>
  `,
  styles: []
})
export class IntegerComponent extends LfbControlWidgetComponent {
}
