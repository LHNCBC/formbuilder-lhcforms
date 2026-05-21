/**
 * Customize the layout of an integer component from ngx-schema-form.
 */
import { AfterViewInit, Component } from '@angular/core';
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
export class IntegerComponent extends LfbOptionControlWidgetComponent implements AfterViewInit {
  protected defaultMinimum: number | null = null;
  protected defaultPlaceholder: string | null = null;

  /**
   * Minimum value to apply to the integer input.
   */
  get inputMin(): number | null {
    return this.schema.minimum ?? this.defaultMinimum;
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
   * Sync the Angular control with the schema form property after view initialization.
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.control.setValue(this.formProperty.value);
  }
}
