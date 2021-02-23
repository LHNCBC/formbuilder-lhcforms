/**
 * Customize checkbox
 */
import {Component, Input, OnInit} from '@angular/core';
import {CheckboxWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-side-label-checkbox',
  template: `<div *ngIf="schema.type!='array'" class="widget row">
      <label *ngIf="!nolabel && schema.title" [attr.for]="id" class="form-check-label col-form-label-sm {{labelWidthClass}}">
        {{ schema.title }}
        <span *ngIf="schema.description"  matTooltipPosition="above" [matTooltip]="schema.description">
          <fa-icon [icon]="faInfo"></fa-icon>
        </span>
      </label>
      <input [formControl]="control" [attr.name]="name"
             [attr.id]="id" [indeterminate]="control.value !== false && control.value !== true ? true :null"
             type="checkbox" [disabled]="schema.readOnly">
      <input *ngIf="schema.readOnly" [attr.name]="name" type="hidden" [formControl]="control">
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
