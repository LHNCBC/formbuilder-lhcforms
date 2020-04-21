import {
  Component,
} from '@angular/core';

import {IntegerWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-integer-widget',
  template: `<div class="widget form-group">
	<label [attr.for]="id" class="horizontal control-label">
		{{ schema.title }}
    <span *ngIf="schema.description"  placement="top" [ngbTooltip]="schema.description">
      <fa-icon [icon]="faInfo"></fa-icon>
    </span>
	</label>
	<input [attr.readonly]="schema.readOnly?true:null" [attr.name]="name"
	[attr.id]="id"
	class="text-widget integer-widget form-control" [formControl]="control"
	[attr.type]="'number'" [attr.min]="schema.minimum" [attr.max]="schema.maximum"
	[attr.placeholder]="schema.placeholder"
	[attr.maxLength]="schema.maxLength || null"
  [attr.minLength]="schema.minLength || null">
</div>`
})
export class IntegerComponent extends IntegerWidget {
  faInfo = faInfoCircle;
}
