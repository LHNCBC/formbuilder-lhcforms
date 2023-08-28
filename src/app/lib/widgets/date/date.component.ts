import {Component, inject, Injectable} from '@angular/core';
import {NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {StringComponent} from '../string/string.component';
import {DateUtil} from '../../date-util';
import {faCalendar} from '@fortawesome/free-solid-svg-icons';

@Injectable()
export class LfbDateAdapter extends NgbDateAdapter<string> {
  fromModel(value: string | null): NgbDateStruct | null {
    return DateUtil.parseISOToDateTime(value).dateStruct;
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
    return DateUtil.parseLocalToDateTime(value).dateStruct;
  }

  format(date: NgbDateStruct | null): string {
    return DateUtil.formatToLocal({dateStruct: date, timeStruct: null, millis: NaN});
  }
}


@Component({
  selector: 'lfb-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.css'],
  providers: [
    {provide: NgbDateAdapter, useClass: LfbDateAdapter},
    {provide: NgbDateParserFormatter, useClass: LfbDateParserFormatter}
  ]
})
export class DateComponent extends StringComponent {
  static id = 0;
  dateIcon = faCalendar;

  calendar = inject(NgbCalendar);
  constructor() {
    super();
    DateComponent.id++;
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
    if(!DateUtil.isValidFormat(inputEl.value)) {
      this.formProperty.setValue(null, false);
    }
  }
}
