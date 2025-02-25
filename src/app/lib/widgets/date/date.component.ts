import {AfterViewInit, Component, ElementRef, inject, Injectable, ViewChild} from '@angular/core';
import {NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
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

  @ViewChild('d', {read: ElementRef}) inputEl: ElementRef;

  calendar = inject(NgbCalendar);
  constructor() {
    super();
    DateComponent.id++;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
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

  /**
   * Select today from the calendar and update the model.
   */
  today() {
    const dateStruct = this.calendar.getToday();
    let val: string = DateUtil.formatToISO({dateStruct, timeStruct: null, millis: NaN});
    val = val.length > 0 ? val : null;
    this.formProperty.setValue(val, false);
  }

  /**
   * Reset formProperty if input box has invalid date format.
   * Intended to be invoked on blur event of an input box.
   * @param event - DOM event
   */
  suppressInvalidDate(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    if(inputEl.classList.contains('ng-invalid')) {
      this.formProperty.setValue(null, false);
    }
  }
}
