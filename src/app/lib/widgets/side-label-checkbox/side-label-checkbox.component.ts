/**
 * Customize checkbox
 */
import {Component, Input, OnInit} from '@angular/core';
import {CheckboxWidget} from '@lhncbc/ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: false,
  selector: 'lfb-side-label-checkbox',
  template: `<div *ngIf="schema.type !== 'array'" class="widget row m-0">
      <label *ngIf="!nolabel && schema.title" [attr.for]="id" class="form-check-label {{labelWidthClass}}">
        {{ schema.title }}
        <div *ngIf="schema.description" tabindex="0" class="btn border-0 m-0 p-0"
                [attr.aria-label]="'Tooltip for '+schema.title+': '+schema.description" [matTooltip]="schema.description">
          <fa-icon [icon]="faInfo"></fa-icon>
        </div>
      </label>
      <input [formControl]="control" name="{{name}}"
             [attr.id]="id" [indeterminate]="control.value !== false && control.value !== true ? true :null"
             type="checkbox" [attr.disabled]="schema.readOnly ? '' : null">
  </div>`,
  styles: [`
    input {
      margin-top: 0.5rem;
    }
  `]
})
export class SideLabelCheckboxComponent  extends CheckboxWidget implements OnInit {
  @Input()
  labelWidthClass: string;
  @Input()
  nolabel = false;
  faInfo = faInfoCircle;

  ngOnInit() {
    const widget = this.formProperty.schema.widget;
    // Input is priority followed by widget definition and default
    this.labelWidthClass =
      this.labelWidthClass
        ? this.labelWidthClass
        : (widget.labelWidthClass
          ? widget.labelWidthClass
          : 'col-sm');
  }

}
