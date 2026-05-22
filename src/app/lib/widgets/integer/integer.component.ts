/**
 * Customize the layout of an integer component from ngx-schema-form.
 */
import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import {FormProperty, ValidatorRegistry} from '@lhncbc/ngx-schema-form';
import { LfbOptionControlWidgetComponent } from '../lfb-option-control-widget/lfb-option-control-widget.component';
import {ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgClass} from "@angular/common";
import {LabelComponent} from "../label/label.component";
import {IntegerDirective} from "../../directives/integer.directive";


@Component({
  selector: 'lfb-integer-widget',
  imports: [ReactiveFormsModule, AsyncPipe, NgClass, LabelComponent, IntegerDirective],
  templateUrl: './integer.component.html',
  styles: []
})
export class IntegerComponent extends LfbOptionControlWidgetComponent implements OnInit, AfterViewInit {
  private validatorRegistry = inject(ValidatorRegistry);
  protected defaultMinimum: number | null = null;
  protected minimumFloor: number | null = null;
  protected defaultPlaceholder: string | null = null;

  /**
   * Minimum value to apply to the integer input.
   */
  get inputMin(): number | null {
    const minimum = this.schema.minimum ?? this.defaultMinimum;
    if(this.minimumFloor !== null && (minimum === null || minimum < this.minimumFloor)) {
      return this.minimumFloor;
    }

    return minimum;
  }

  /**
   * Maximum value to apply to the integer input.
   */
  get inputMax(): number | null {
    return this.schema.maximum ?? null;
  }

  /**
   * Placeholder text to show when the schema does not provide one.
   */
  get inputPlaceholder(): string | null {
    return this.schema.placeholder ?? this.defaultPlaceholder;
  }

  /**
   * Whether the current value should display validation errors.
   */
  get hasErrorDisplayValue(): boolean {
    const value = this.formProperty.value;
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Build a schema-form validation error for an out-of-range integer.
   */
  private getRangeError(code: 'MINIMUM' | 'MAXIMUM', value: number, limit: number, formProperty: FormProperty) {
    const comparison = code === 'MINIMUM' ? 'less than minimum' : 'greater than maximum';
    return {
      code,
      path: `#${formProperty.path}`,
      message: `Value ${value} is ${comparison} ${limit}`,
      params: [value, limit]
    };
  }

  /**
   * Validate integer values against the widget's default and schema-provided range.
   */
  private getRangeErrors(value: unknown, formProperty: FormProperty): any[] | null {
    if(value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    if(!Number.isFinite(numericValue)) {
      return null;
    }

    const errors = [];
    if(this.inputMin !== null && numericValue < this.inputMin) {
      errors.push(this.getRangeError('MINIMUM', numericValue, this.inputMin, formProperty));
    }

    if(this.inputMax !== null && numericValue > this.inputMax) {
      errors.push(this.getRangeError('MAXIMUM', numericValue, this.inputMax, formProperty));
    }

    return errors.length ? errors : null;
  }

  /**
   * Register range validation with the schema-form validation pipeline.
   */
  override ngOnInit(): void {
    super.ngOnInit();
    this.validatorRegistry.register(this.formProperty.path, ((value, formProperty) => {
      return this.getRangeErrors(value, formProperty);
    }) as any);
    this.formProperty.updateValueAndValidity(true, true);
  }

  /**
   * Sync the Angular control with the schema form property after view initialization.
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.control.setValue(this.formProperty.value);
  }
}
