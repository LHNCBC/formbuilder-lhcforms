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
      <div [ngClass]="{'form-group': true, 'row': labelPosition === 'left'}">
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
  styles: [`
    /*
    .form-group {
      margin: 0;
    }
    .row {
      margin: 0;
    }
    :host ::ng-deep .col, .col-1, .col-2, .col-3, .col-4, .col-5, .col-6, .col-7, .col-8, .col-9, .col-10, .col-11, .col-12,
    .col-sm, .col-sm-1, .col-sm-2, .col-sm-3, .col-sm-4, .col-sm-5, .col-sm-6, .col-sm-7, .col-sm-8, .col-sm-9, .col-sm-10, .col-sm-11, .col-sm-12
    {
      padding-right: 5px;
      padding-left: 5px;
    }
    */
  `]
})
export class IntegerComponent extends AppControlWidgetComponent {
}
