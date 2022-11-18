import { AfterViewInit, Component } from '@angular/core';
import {FormProperty} from '@lhncbc/ngx-schema-form';

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
               type="text"
               [attr.placeholder]="schema.placeholder"
               [attr.maxLength]="schema.maxLength || null"
               [attr.minLength]="schema.minLength || null">
      </div>
    </ng-template>

  `
})
export class NumberComponent extends LfbControlWidgetComponent implements AfterViewInit {
  controlValue: string;

  ngAfterViewInit() {
    const control = this.control;
    this.formProperty.valueChanges.subscribe((newValue) => {
      if (this.isEquivalent(this.controlValue, newValue)) {
        // Both are equal in value, but could be different strings,
        // in which case retain user typed string.
        control.setValue(this.controlValue, { emitEvent: false });
      } else {
        // Set control to form property value.
        control.setValue(newValue, { emitEvent: false });
      }
    });
    control.valueChanges.subscribe((newValue) => {
      // Override NumberProperty.setValue();
      this.setPropertyValue(this.formProperty, newValue, false);
    });
  }

  /**
   * This is intended to override this.formProperty.setValue().
   * The FormPropertyFactory creates the type of FormProperty
   * based on the field type (number, string, boolean etc) defined in the json schema.
   *
   * @param prop - This is NumberProperty type, whose setValue() is bypassed by this call.
   * @param value - New value to set
   * @param onlySelf - Flag to update only this component i.e not ancestors, defaults to false.
   */
  setPropertyValue(prop: FormProperty, value: any, onlySelf = false) {
    const re = '^\\s*([\\+\\-]?\\d*\\.?\\d*)';
    const matches = String(value).match(new RegExp(re));
    value = matches ? matches[1] : null;
    this.controlValue = value; // Store user's original string
    if (typeof value === 'string') {
      if (value.trim().length === 0) {
        value = null;
      } else {
        const numVal = parseFloat(value);
        value = isNaN(numVal) ? null : numVal;
      }
    }
    prop._value = value;
    prop.updateValueAndValidity(onlySelf, true);
  }

  /**
   * Compare control's value to what is converted to property value.
   *
   * @param controlValue - String value from control
   * @param propValue - Property value after form property is set.
   * @return -
   *   Return true to set controlValue to the control,
   *   false to set it with property value.
   */
  isEquivalent(controlValue: any, propValue: any) {
    // Accept string starting with decimal or number, even though they are not equal to parseFloat().
    return controlValue === '.' || controlValue === '-' || parseFloat(controlValue) === parseFloat(propValue);
  }
}
