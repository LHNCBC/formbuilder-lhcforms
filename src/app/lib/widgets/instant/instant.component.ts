import {Component, OnInit} from '@angular/core';
import {
  NgbDate,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbTimeAdapter,
  NgbTimepickerModule,
  NgbTimeStruct
} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

import {
  DatetimeComponent,
  LfbDateAdapter,
  LfbDateParserFormatter,
  LfbTimeAdapter
} from '../datetime/datetime.component';
import {DateTime, DateUtil} from '../../date-util';
import {LabelComponent} from '../label/label.component';
import {LfbDisableControlDirective} from '../../directives/lfb-disable-control.directive';
import {ensureInstantPrecision} from './instant-util';

@Component({
  selector: 'lfb-instant',
  imports: [
    NgbDatepickerModule, NgbTimepickerModule, FormsModule, ReactiveFormsModule, NgClass, LabelComponent,
    LfbDisableControlDirective, FontAwesomeModule
  ],
  templateUrl: '../datetime/datetime.component.html',
  styleUrls: ['../datetime/datetime.component.css'],
  providers: [
    {provide: NgbDateAdapter, useClass: LfbDateAdapter},
    {provide: NgbDateParserFormatter, useClass: LfbDateParserFormatter},
    {provide: NgbTimeAdapter, useClass: LfbTimeAdapter}
  ]
})
export class InstantComponent extends DatetimeComponent implements OnInit {

  override ngOnInit() {
    super.ngOnInit();
    this.canToggleTime = false;
    this.includeTime = true;

    if(ensureInstantPrecision(this.dateTime)) {
      this.updateValue(this.dateTime.timeStruct);
    }
  }

  override updateValue(event?: NgbTimeStruct) {
    if(event) {
      this.dateTime.timeStruct = event;
    }

    this.includeTime = true;
    ensureInstantPrecision(this.dateTime);

    let val: string | null = DateUtil.formatToISO(this.dateTime);
    val = val.length > 0 ? val : null;
    this.formProperty.setValue(val, false);
  }

  override onDateSelected(selectedDate: NgbDate) {
    this.dateTime.dateStruct = {year: selectedDate.year, month: selectedDate.month, day: selectedDate.day};
    this.dateTime.timeStruct = {hour: 0, minute: 0, second: 0};
    this.dateTime.millis = NaN;
    this.updateValue(this.dateTime.timeStruct);
  }

  override today() {
    this.dateTime.dateStruct = this.calendar.getToday();
    this.dateTime.timeStruct = {hour: 0, minute: 0, second: 0};
    this.dateTime.millis = NaN;
    this.updateValue(this.dateTime.timeStruct);
  }

  /**
   * On blur, let the base class clear the form property if the input is invalid,
   * then promote a date-only value to a full instant by defaulting the time to
   * 00:00:00. A value already at second precision is left untouched so we don't
   * overwrite what the form/adapter pipeline produced.
   *
   * @param event - DOM blur event from the datetime input.
   */
  override suppressInvalidValue(event: Event) {
    super.suppressInvalidValue(event);
    if(!this.formProperty.value) {
      return; // Base class invalidated/cleared the value; nothing to normalize.
    }

    // `this.dateTime` is the shared object mutated by the date/time adapters.
    // If the user typed only a date (no time), `timeStruct` will be null here.
    if(this.isDateOnly(this.dateTime)) {
      if(ensureInstantPrecision(this.dateTime)) {
        this.updateValue(this.dateTime.timeStruct);
      }
    }
  }

  /**
   * Indicates whether the supplied structure carries a complete date but no time.
   *
   * @param dateTime - Structure used by the datetime adapters.
   */
  private isDateOnly(dateTime: DateTime): boolean {
    const ds = dateTime?.dateStruct;
    return !!(ds?.year && ds.month && ds.day) && !dateTime?.timeStruct;
  }
}
