import { Component, OnInit, OnDestroy } from '@angular/core';
import { ObjectWidget, FormProperty } from '@lhncbc/ngx-schema-form';
import { LabelComponent } from "../label/label.component";
import { Subscription } from 'rxjs';
import {CommonModule} from "@angular/common";
import {AppFormElementComponent} from "../form-element/form-element.component";
import {DateUtil} from "../../date-util";

@Component({
  selector: 'lfb-date-range',
  imports: [LabelComponent, CommonModule, AppFormElementComponent],
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.css']
})
export class DateRangeComponent extends ObjectWidget implements OnInit, OnDestroy {
  startProp: FormProperty;
  endProp: FormProperty;
  rangeError: string | null = null;
  labelPosition: string;
  labelClasses: string;
  controlClasses: string;
  private subscriptions: Subscription[] = [];

  /**
   * Initializes widget layout options, child date properties, and reactive validation subscriptions.
   */
  ngOnInit() {
    const widget = this.formProperty.schema.widget || {};
    this.labelPosition = widget.labelPosition || 'top';
    this.labelClasses = widget.labelClasses || '';
    this.controlClasses = widget.controlClasses || '';

    this.startProp = this.formProperty.getProperty('start');
    this.endProp = this.formProperty.getProperty('end');
    this.configureDateTimeProperty(this.startProp, 'Start');
    this.configureDateTimeProperty(this.endProp, 'End');

    this.subscriptions.push(
      this.startProp.valueChanges.subscribe(() => this.validateRange()),
      this.endProp.valueChanges.subscribe(() => this.validateRange())
    );
    this.validateRange();
  }

  /**
   * Normalizes a child Period boundary field to use the datetime widget configuration.
   *
   * @param prop - Child form property (`start` or `end`) to configure.
   * @param title - Display label for the child field.
   */
  private configureDateTimeProperty(prop: FormProperty, title: string) {
    const widget = prop.schema.widget || {};
    prop.schema.title = title;
    prop.schema.widget = {
      ...widget,
      id: 'datetime',
      labelPosition: 'top',
      labelClasses: '',
      controlClasses: 'col-12',
      placeholder: 'yyyy-MM-dd hh:mm:ss (AM|PM)'
    };
  }

  /**
   * Updates the range-level error message based on the current start/end values.
   */
  validateRange() {
    const start = this.startProp?.value;
    const end = this.endProp?.value;
    if (this.isInvalidRange(start, end)) {
      this.rangeError = 'End date must be on or after start date.';
    } else {
      this.rangeError = null;
    }
  }

  /**
   * Clears start when the range is invalid after focus leaves the start field.
   */
  onStartBlur() {
    if (this.isInvalidRange(this.startProp.value, this.endProp.value)) {
      this.startProp.setValue(null, false);
      this.rangeError = 'Start date was cleared because it was after end date.';
    }
  }

  /**
   * Clears end when the range is invalid after focus leaves the end field.
   */
  onEndBlur() {
    if (this.isInvalidRange(this.startProp.value, this.endProp.value)) {
      this.endProp.setValue(null, false);
      this.rangeError = 'End date was cleared because it was before start date.';
    }
  }

  /**
   * Compares parsed start/end values and returns true when start is later than end.
   *
   * @param start - FHIR date or dateTime string from the start field.
   * @param end - FHIR date or dateTime string from the end field.
   * @returns True if both parse and start is after end.
   */
  private isInvalidRange(start: string | null, end: string | null): boolean {
    const startDate = this.parseFHIRDateTime(start);
    const endDate = this.parseFHIRDateTime(end);
    return !!(startDate && endDate && startDate.getTime() > endDate.getTime());
  }

  /**
   * Parses a FHIR date/dateTime string into a Date only when validation succeeds.
   *
   * @param value - FHIR date/dateTime string to parse.
   * @returns Parsed Date, or null when missing/invalid.
   */
  private parseFHIRDateTime(value: string | null): Date | null {
    if (!value) {
      return null;
    }
    const dateValidation = DateUtil.validateDate(value);
    return dateValidation.validDate ? dateValidation.date : null;
  }

  /**
   * Releases value-change subscriptions created during initialization.
   */
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
