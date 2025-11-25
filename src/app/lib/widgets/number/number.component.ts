import { Component } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

/**
 * Component to handle number/decimal type.
 */
@Component({
  standalone: false,
  selector: 'lfb-number-widget',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           name="{{name}}" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        <lfb-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelClasses"
        ></lfb-label>
        <div class="{{controlClasses}}">
          <input [attr.readonly]="schema.readOnly?true:null" name="{{name}}"
                 [attr.id]="id"
                 class="form-control" [formControl]="control"
                 type="number" [attr.min]="schema.minimum" [attr.max]="schema.maximum" step="any"
                 [attr.placeholder]="schema.placeholder"
                 [attr.maxLength]="schema.maxLength || null"
                 [attr.minLength]="schema.minLength || null">
        </div>
      </div>
    </ng-template>

  `
})
export class NumberComponent extends LfbControlWidgetComponent {
}
