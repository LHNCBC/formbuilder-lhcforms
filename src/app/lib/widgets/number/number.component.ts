import { Component } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

/**
 * Component to handle number/decimal type.
 */
@Component({
  standalone: false,
  selector: 'lfb-number-widget',
  template: `
    @if (schema.widget.id ==='hidden') {
      <input
        name="{{name}}" type="hidden" [formControl]="control">
    } @else {
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        @if (!nolabel) {
          <lfb-label
            [for]="id"
            [title]="schema.title"
            [helpMessage]="schema.description"
            [ngClass]="labelWidthClass + ' ps-0 pe-1'"
          ></lfb-label>
        }
        <input [attr.readonly]="schema.readOnly?true:null" name="{{name}}"
          [attr.id]="id"
          class="form-control {{controlWidthClass}}" [formControl]="control"
          type="number" [attr.min]="schema.minimum" [attr.max]="schema.maximum" step="any"
          [attr.placeholder]="schema.placeholder"
          [attr.maxLength]="schema.maxLength || null"
          [attr.minLength]="schema.minLength || null">
      </div>
    }
    
    `
})
export class NumberComponent extends LfbControlWidgetComponent {
}
