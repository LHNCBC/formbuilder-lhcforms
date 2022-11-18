import { Component } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

/**
 * Component to handle number/decimal type.
 */
@Component({
  selector: 'lfb-number-widget',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           [attr.name]="name" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        <lfb-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass + ' pl-0 pr-1'"
        ></lfb-label>
        <input [attr.readonly]="schema.readOnly?true:null" [attr.name]="name"
               [attr.id]="id"
               class="text-widget integer-widget form-control {{controlWidthClass}}" [formControl]="control"
               type="number" [attr.min]="schema.minimum" [attr.max]="schema.maximum"
               [attr.placeholder]="schema.placeholder"
               [attr.maxLength]="schema.maxLength || null"
               [attr.minLength]="schema.minLength || null">
      </div>
    </ng-template>

  `
})
export class NumberComponent extends LfbControlWidgetComponent {
}
