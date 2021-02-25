/**
 * Customize layout of checkbox from ngx-schema-form.
 */
import { Component, OnInit, Input } from '@angular/core';
import {CheckboxWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lfb-checkbox',
  template: `<div class="widget form-group">
	<div *ngIf="schema.type!='array'" class="form-check">
    <input class="form-check-input" [formControl]="control" [attr.name]="name"
             [attr.id]="id" [indeterminate]="control.value !== false && control.value !== true ? true :null"
             type="checkbox" [attr.disabled]="schema.readOnly ? '' : null">
    <input *ngIf="schema.readOnly" [attr.name]="name" type="hidden" [formControl]="control">
    <label *ngIf="!nolabel && schema.title" [attr.for]="id" class="form-check-label control-label">
      {{ schema.title }}
      <span *ngIf="schema.description"  matTooltipPosition="above" [matTooltip]="schema.description">
        <fa-icon [icon]="faInfo"></fa-icon>
      </span>
    </label>
	</div>
	<ng-container *ngIf="schema.type==='array'">
		<div *ngFor="let option of schema.items.oneOf" class="checkbox">
			<label class="horizontal control-label">
				<input [attr.name]="name"
					value="{{option.enum[0]}}" type="checkbox"
					[attr.disabled]="schema.readOnly ? '' : null"
					(change)="onCheck($event.target)"
					[attr.checked]="checked[option.enum[0]] ? true : null"
					[attr.id]="id + '.' + option.enum[0]"
					>
				{{option.description}}
			</label>
		</div>
	</ng-container>
</div>`
})
export class CheckboxComponent extends CheckboxWidget {
  @Input()
  nolabel = false;
  faInfo = faInfoCircle;
}
