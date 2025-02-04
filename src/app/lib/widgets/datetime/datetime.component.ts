import {Component, ElementRef, inject, Injectable, OnInit, ViewChild} from '@angular/core';
import {
  NgbCalendar,
  NgbDate,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDateStruct,
  NgbInputDatepicker,
  NgbTimeAdapter,
  NgbTimeStruct
} from '@ng-bootstrap/ng-bootstrap';
import {DateComponent} from '../date/date.component';
import {DateUtil, DateTime} from '../../date-util';

interface ConfigureDateTime {
  setDateTime(dateTime: DateTime);
}

/**
 * Example of a String Time adapter
 */
@Injectable()
export class LfbTimeAdapter extends NgbTimeAdapter<NgbTimeStruct> implements ConfigureDateTime {
  static id = 0;
  static readonly DELIMITER = '-';
  dateTime: DateTime = null;

  constructor() {
    super();
    LfbTimeAdapter.id++;
  }

  setDateTime(dateTime: DateTime) {
    this.dateTime = dateTime;
  }
  fromModel(timeStruct: NgbTimeStruct | null): NgbTimeStruct | null {
    this.dateTime.timeStruct = timeStruct;
    return this.dateTime.timeStruct;
  }

  toModel(time: NgbTimeStruct | null): NgbTimeStruct | null {
    this.dateTime.timeStruct = time;
    return this.dateTime.timeStruct;
  }
}

/**
 * This Service handles how the date is represented in scripts i.e. ngModel.
 */
@Injectable()
export class LfbDateAdapter extends NgbDateAdapter<string> implements ConfigureDateTime  {
  static id = 0;
  static readonly DELIMITER = '-';
  dateTime: DateTime = null;

  constructor() {
    super();
    LfbDateAdapter.id++;
  }



  setDateTime(dateTime: DateTime) {
    this.dateTime = dateTime;
  }

  /**
   *
   * @param value - model, which is ISO string
   */
  fromModel(value: string | null): NgbDateStruct | null {
    const dateTime = DateUtil.parseISOToDateTime(value);
    Object.assign(this.dateTime, dateTime);
    return this.dateTime.dateStruct;
  }

  toModel(date: NgbDateStruct | null): string | null {
    this.dateTime.dateStruct = date;
    const val = DateUtil.formatToISO(this.dateTime);
    return val.length > 0 ? val : null;
  }
}

/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 */
@Injectable()
export class LfbDateParserFormatter extends NgbDateParserFormatter implements ConfigureDateTime  {

  static id = 0;
  dateTime: DateTime = null;
  constructor() {
    super();
    LfbDateParserFormatter.id++;
  }

  setDateTime(dateTime: DateTime) {
    this.dateTime = dateTime;
  }
  parse(value: string): NgbDateStruct {
    const dateTime: DateTime = DateUtil.parseLocalToDateTime(value);
    Object.assign(this.dateTime, dateTime);
    return this.dateTime.dateStruct;
  }

  format(date: NgbDateStruct | null): string {
    this.dateTime.dateStruct = date;
    return DateUtil.formatToLocal(this.dateTime);
  }

}

@Component({
  standalone: false,
  selector: 'lfb-datetime',
  templateUrl: './datetime.component.html',
  styleUrls: ['./datetime.component.css'],
  providers: [
    {provide: NgbDateAdapter, useClass: LfbDateAdapter},
    {provide: NgbDateParserFormatter, useClass: LfbDateParserFormatter},
    {provide: NgbTimeAdapter, useClass: LfbTimeAdapter}
  ]
})
export class DatetimeComponent extends DateComponent implements OnInit {

  static id = 0;
  dateTime: DateTime = {dateStruct: null, timeStruct: null, millis: NaN};
  includeTime = true;

  model: string;
  @ViewChild('inputBox', {read: ElementRef}) inputRef: ElementRef;
  @ViewChild('d', {read: NgbInputDatepicker}) dp: NgbInputDatepicker;

  calendar = inject(NgbCalendar);
  constructor(private dateAdapter: NgbDateAdapter<string>,
              private parserFormatter: NgbDateParserFormatter,
              private timeAdapter: NgbTimeAdapter<NgbTimeStruct>) {
    super();
    DatetimeComponent.id++;
  }
  ngOnInit() {
    super.ngOnInit();
    const dTime = DateUtil.parseISOToDateTime(this.formProperty.value);
    this.dateTime.dateStruct = dTime.dateStruct;
    this.dateTime.timeStruct = dTime.timeStruct;
    this.dateTime.millis = dTime.millis;
    this.includeTime = !(dTime.dateStruct && !dTime.timeStruct);
    (this.parserFormatter as unknown as ConfigureDateTime).setDateTime(this.dateTime);
    (this.dateAdapter as unknown as ConfigureDateTime).setDateTime(this.dateTime);
    (this.timeAdapter as unknown as ConfigureDateTime).setDateTime(this.dateTime);
  }

  /**
   * Used in time input template to update formProperty value.
   * @param event - Not used.
   */
  updateValue(event?) {
    this.dateTime.timeStruct = event || null;
    let val: string | null = DateUtil.formatToISO(this.dateTime);
    val = val.length > 0 ? val : null;
    this.formProperty.setValue(val, false);
  }

  onDateSelected(selectedDate: NgbDate) {
    this.dateTime.dateStruct = {year: selectedDate.year, month: selectedDate.month, day: selectedDate.day};
  }

  /**
   * Select current time.
   */
  now() {
    this.includeTime = true;
    this.dateTime.dateStruct = this.calendar.getToday();
    const now = new Date();
    this.dateTime.timeStruct = {
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds()
    };
    this.dateTime.millis = now.getMilliseconds();
    this.updateValue(this.dateTime.timeStruct);
  }

  /**
   * Select current date.
   */
  today() {
    this.dateTime.dateStruct = this.calendar.getToday();
    this.updateValue(this.dateTime.timeStruct);
  }

  /**
   * Handle user keyboard input.
   */
  handleInput() {
    const inputEl = this.inputRef.nativeElement;
    const value = inputEl?.value;
    if(inputEl?.classList.contains('ng-valid') && value?.trim().length > 0) {
      const d = new Date(value.trim());
      if(DateUtil.isValidDate(d)) {
        this.dp.navigateTo({year: d.getUTCFullYear(), month: d.getUTCMonth()+1, day: d.getUTCDate()});
      }
    }
  }
}
