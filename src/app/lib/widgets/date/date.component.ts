import {AfterViewInit, Component, ElementRef, inject, Injectable, ViewChild} from '@angular/core';
import {NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepicker, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {StringComponent} from '../string/string.component';
import {DateUtil} from '../../date-util';
import {faCalendar} from '@fortawesome/free-solid-svg-icons';

@Injectable()
export class LfbDateAdapter extends NgbDateAdapter<string> {
  fromModel(value: string | null): NgbDateStruct | null {
    return DateUtil.parseISOToDateTime(value, true).dateStruct;
  }

  toModel(date: NgbDateStruct | null): string | null {
    let ret = null;
    if(date) {
      ret = DateUtil.formatToISO({dateStruct: date, timeStruct: null, millis: NaN});
    }
    return ret;
  }

}

/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 */
@Injectable()
export class LfbDateParserFormatter extends NgbDateParserFormatter {

  parse(value: string): NgbDateStruct {
    return DateUtil.parseLocalToDateTime(value, true).dateStruct;
  }

  format(date: NgbDateStruct | null): string {
    return DateUtil.formatToLocal({dateStruct: date, timeStruct: null, millis: NaN});
  }
}


@Component({
  standalone: false,
  selector: 'lfb-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.css'],
  providers: [
    {provide: NgbDateAdapter, useClass: LfbDateAdapter},
    {provide: NgbDateParserFormatter, useClass: LfbDateParserFormatter}
  ]
})
export class DateComponent extends StringComponent implements AfterViewInit {
  static id = 0;
  dateIcon = faCalendar;
  @ViewChild('d') datepicker: NgbDatepicker;
  @ViewChild('dateInput', {read: ElementRef, static: false}) inputEl: ElementRef;


  calendar = inject(NgbCalendar);
  constructor() {
    super();
    DateComponent.id++;
  }

  /**
   * Navigates the datepicker to today's date and updates the model value to today.
   * If the datepicker is available, it calls its navigateTo method, then sets the form property to today.
   */
  navigateToToday() {
    if (this.datepicker) {
      this.datepicker.navigateTo();
    }
    this.today();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (this.inputEl) {

      const inputEl = this.inputEl.nativeElement as HTMLInputElement;
      this.formProperty.valueChanges.subscribe((val) => {
        // If the value is invalid, NgbDatepicker does not update input element's value.
        // yyyy, and yyyy-MM are valid in FHIR but not in ngbDatepicker.
        // Manually update the input's value.
        if(inputEl.value !== val && /^([0-9]{4}(-[0-9]{2})?)?$/.test(val?.trim())) {
          inputEl.value = val;
        }
      });
    }

    this.control.setValue(this.formProperty.value);
  }

  /**
   * Select today from the calendar and update the model.
   */
  today() {
    const dateStruct = this.calendar.getToday();
    let val: string = DateUtil.formatToISO({dateStruct, timeStruct: null, millis: NaN});
    val = val.length > 0 ? val : null;
    this.formProperty.setValue(val, false);
  }

}
