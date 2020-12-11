import {
  Component,
  Input, OnInit
} from '@angular/core';

import {IntegerWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {AppControlWidgetComponent} from './app-control-widget.component';

@Component({
  selector: 'app-integer-widget',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           [attr.name]="name" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left'}">
        <app-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass"
        ></app-label>
	      <input [attr.readonly]="schema.readOnly?true:null" [attr.name]="name"
	        [attr.id]="id"
	        class="text-widget integer-widget form-control {{controlWidthClass}}" [formControl]="control"
	        [attr.type]="'number'" [attr.min]="schema.minimum" [attr.max]="schema.maximum"
	        [attr.placeholder]="schema.placeholder"
	        [attr.maxLength]="schema.maxLength || null"
          [attr.minLength]="schema.minLength || null">
      </div>
    </ng-template>
  `,
  styles: [``]
})
export class IntegerComponent extends AppControlWidgetComponent {
}
