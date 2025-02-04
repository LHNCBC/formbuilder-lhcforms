/**
 * Customize layout of checkbox from ngx-schema-form.
 */
import { Component, Input } from '@angular/core';
import {CheckboxWidget} from '@lhncbc/ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: false,
  selector: 'lfb-checkbox',
  template: `<div class="widget">
	<div *ngIf="schema.type !== 'array'" [attr.class]="'form-check '+lfbClass">
    <input class="form-check-input" [formControl]="control" name="{{name}}"
             [attr.id]="id" [indeterminate]="control.value !== false && control.value !== true ? true :null"
             type="checkbox" [attr.disabled]="schema.readOnly ? '' : null">
    <input *ngIf="schema.readOnly" name="{{name}}" type="hidden" [formControl]="control">
    <label *ngIf="!nolabel && schema.title" [attr.for]="id" class="form-check-label control-label">
      {{ schema.title }}
      <div *ngIf="schema.description" tabindex="0"
              class="btn border-0 m-0 p-0"
              [attr.aria-label]="'Tooltip for '+schema.title+': '+schema.description"
              [matTooltip]="schema.description">
        <fa-icon [icon]="faInfo"></fa-icon>
      </div>
    </label>
	</div>
	<ng-container *ngIf="schema.type==='array'">
		<div *ngFor="let option of schema.items.oneOf" class="checkbox">
			<label class="horizontal control-label">
				<input name="{{name}}"
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
  @Input()
  lfbClass = 'text-center';
}
