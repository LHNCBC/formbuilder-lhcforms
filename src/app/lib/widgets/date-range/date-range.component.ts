import { Component, OnInit, OnDestroy } from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import { ObjectWidget, FormProperty } from '@lhncbc/ngx-schema-form';
import { NgbDatepickerModule, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { LfbDateAdapter, LfbDateParserFormatter } from '../date/date.component';
import { LabelComponent } from "../label/label.component";
import {faCalendar} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import {CommonModule} from "@angular/common";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'lfb-date-range',
  imports: [LabelComponent, CommonModule, ReactiveFormsModule, FontAwesomeModule, NgbDatepickerModule],
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.css'],
  providers: [
    { provide: NgbDateAdapter, useClass: LfbDateAdapter },
    { provide: NgbDateParserFormatter, useClass: LfbDateParserFormatter }
  ]
})
export class DateRangeComponent extends ObjectWidget implements OnInit, OnDestroy {
  dateIcon = faCalendar;
  private startProp: FormProperty;
  private endProp: FormProperty;
  startControl = new FormControl();
  endControl = new FormControl();
  rangeError: string | null = null;
  labelPosition: string;
  labelClasses: string;
  controlClasses: string;
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    const widget = this.formProperty.schema.widget || {};
    this.labelPosition = widget.labelPosition || 'top';
    this.labelClasses = widget.labelClasses || '';
    this.controlClasses = widget.controlClasses || '';

    this.startProp = this.formProperty.getProperty('start');
    this.endProp = this.formProperty.getProperty('end');

    // Sync form controls with schema-form properties
    this.startControl.setValue(this.startProp.value, { emitEvent: false });
    this.endControl.setValue(this.endProp.value, { emitEvent: false });

    this.subscriptions.push(
      this.startControl.valueChanges.subscribe(val => {
        this.startProp.setValue(val, false);
        this.validateRange();
      }),
      this.endControl.valueChanges.subscribe(val => {
        this.endProp.setValue(val, false);
        this.validateRange();
      }),
      this.startProp.valueChanges.subscribe(val => {
        if (this.startControl.value !== val) {
          this.startControl.setValue(val, { emitEvent: false });
        }
      }),
      this.endProp.valueChanges.subscribe(val => {
        if (this.endControl.value !== val) {
          this.endControl.setValue(val, { emitEvent: false });
        }
      })
    );
  }

  /**
   * Show error if range is invalid, clear it if valid.
   */
  validateRange() {
    const start = this.startControl.value;
    const end = this.endControl.value;
    if (start && end && start > end) {
      this.rangeError = 'End date must be on or after start date.';
    } else {
      this.rangeError = null;
    }
  }

  /**
   * On blur, clear the invalid value for start date.
   */
  onStartBlur() {
    const start = this.startControl.value;
    const end = this.endControl.value;
    if (start && end && start > end) {
      this.startControl.setValue(null, { emitEvent: false });
      this.startProp.setValue(null, false);
      this.rangeError = 'Start date was cleared because it was after end date.';
    }
  }

  /**
   * On blur, clear the invalid value for end date.
   */
  onEndBlur() {
    const start = this.startControl.value;
    const end = this.endControl.value;
    if (start && end && start > end) {
      this.endControl.setValue(null, { emitEvent: false });
      this.endProp.setValue(null, false);
      this.rangeError = 'End date was cleared because it was before start date.';
    }
  }

  /**
   * Called when start date is picked from calendar (dateSelect event).
   */
  onStartDateSelect() {
    setTimeout(() => this.onStartBlur());
  }

  /**
   * Called when end date is picked from calendar (dateSelect event).
   */
  onEndDateSelect() {
    setTimeout(() => this.onEndBlur());
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
