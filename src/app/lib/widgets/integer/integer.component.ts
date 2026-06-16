/**
 * Customize the layout of an integer component from ngx-schema-form.
 */
import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import {FormProperty, ValidatorRegistry} from '@lhncbc/ngx-schema-form';
import {ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgClass} from "@angular/common";
import {LabelComponent} from "../label/label.component";
import {IntegerDirective} from "../../directives/integer.directive";
import { Observable, of } from 'rxjs';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import { AnswerOptionService } from '../../../services/answer-option.service';
import { EnableWhenAnswerOptionsService } from '../../../services/enable-when-answer-options.service';
import { EnableWhenAnswerOptionsDirective } from '../../directives/enable-when-answer-options.directive';


@Component({
  selector: 'lfb-integer-widget',
  imports: [ReactiveFormsModule, AsyncPipe, NgClass, LabelComponent, IntegerDirective, EnableWhenAnswerOptionsDirective],
  templateUrl: './integer.component.html',
  styles: []
})
export class IntegerComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  private validatorRegistry = inject(ValidatorRegistry);
  answerOptionService = inject(AnswerOptionService);
  enableWhenAnswerOptionsService = new EnableWhenAnswerOptionsService(this.answerOptionService);
  hasAnswerOptions$: Observable<boolean> = of(false);

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
    this.subscribeToErrors();
    this.initEnableWhenAnswerOptions();
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

  /**
   * Cleans up the answer-options autocomplete service and base widget resources.
   *
   */
  ngOnDestroy(): void {
    this.enableWhenAnswerOptionsService.destroy();
    super.ngOnDestroy();
  }

  /**
   * Initializes answer-option autocomplete support when this integer field is an enableWhen answer field.
   *
   */
  private initEnableWhenAnswerOptions(): void {
    const canonicalPath = (this.formProperty as any).__canonicalPathNotation || '';
    if (canonicalPath.match(/^enableWhen\.(\d+)\.answer(\w+).*$/)) {
      this.enableWhenAnswerOptionsService.init(this.formProperty, this.control);
      this.hasAnswerOptions$ = this.enableWhenAnswerOptionsService.hasAnswerOptions$;
    }
  }
}
