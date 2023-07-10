import {Component, Injectable, OnInit} from '@angular/core';
import {NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbTimeAdapter, NgbTimeStruct} from '@ng-bootstrap/ng-bootstrap';
import {DateComponent} from '../date/date.component';


interface DateTime {
  date: Date;
}


interface ConfigureDateTime {
  setDateTime(dateTime: DateTime);
}

const formatISODateTime = (dateTime: DateTime) => {
  let ret: string = null;
  if(dateTime.date) {
    ret = dateTime.date.toISOString();
  }
  return ret;
}

const isValidDate = (date: Date) => {
  return date && !isNaN(date.getTime());
}
/**
 * Example of a String Time adapter
 */
@Injectable()
export class LfbTimeAdapter extends NgbTimeAdapter<Date> implements ConfigureDateTime {
  static id = 0;
  static readonly DELIMITER = '-';
  dateTime: DateTime = null;

  constructor() {
    super();
    LfbTimeAdapter.id++;
    console.log(`LfbTimeAdapter: constructor(): ${LfbTimeAdapter.id}`);
  }

  setDateTime(dateTime: DateTime) {
    this.dateTime = dateTime;
  }
  fromModel(date: Date | null): NgbTimeStruct | null {
    let ret = null;
    if (isValidDate(date)) {
        ret = {
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds(),
        };
    }
    return ret;
  }

  toModel(time: NgbTimeStruct | null): Date | null {
    this.dateTime.date.setHours(time.hour);
    this.dateTime.date.setMinutes(time.minute);
    this.dateTime.date.setSeconds(time.second);
    return this.dateTime.date;
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
    console.log(`LfbDateTimeAdapter: constructor(): ${LfbDateAdapter.id}`);
  }



  setDateTime(dateTime: DateTime) {
    this.dateTime = dateTime;
  }

  /**
   *
   * @param value - model, which is ISO string
   */
  fromModel(value: string | null): NgbDateStruct | null {
    let ret = null;
    const dt = new Date(value);
    if(value && isValidDate(dt)) {
      this.dateTime.date = dt;
      ret = {
        year: dt.getFullYear(),
        month: dt.getMonth()+1,
        day: dt.getDate()
      }
    }

    return ret;
  }

  toModel(date: NgbDateStruct | null): string | null {
    let ret = null;
    if(date) {
      if(!this.dateTime.date) {
        this.dateTime.date = new Date(Date.now());
      }
      this.dateTime.date.setFullYear(date.year);
      this.dateTime.date.setMonth(date.month - 1);
      this.dateTime.date.setDate(date.day);
      ret = this.dateTime.date.toISOString();
    }
    return ret;
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
    console.log(`LfbDateTimeParserFormatter: constructor(): ${LfbDateParserFormatter.id}`);
  }

  setDateTime(dateTime: DateTime) {
    this.dateTime = dateTime;
  }
  parse(value: string): NgbDateStruct {
    // const dateTime = LfbDateTimeParserFormatter.parseDateTime(value);
    let ret = null;
    const date = new Date(value);
    if(isValidDate(date)) {
      this.dateTime.date.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      ret = {
        year: date.getFullYear(),
        month: date.getMonth()+1,
        day: date.getDate()
      }
    }

    return ret;
  }

  format(date: NgbDateStruct | null): string {
    let ret = '';
    if(date) {
      ret = this.dateTime.date?.toLocaleString();
    }
    return ret;
  }
}

@Component({
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
  dateTime: DateTime = {date: null};
  dateTimeRE = '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]{1,9})?)?)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)?)?)?';

  constructor(private dateAdapter: NgbDateAdapter<string>,
              private parserFormatter: NgbDateParserFormatter,
              private timeAdapter: NgbTimeAdapter<Date> ) {
    super();
    DatetimeComponent.id++;
    console.log(`DateTimeComponent: constructor(): ${DatetimeComponent.id}`);
  }
  ngOnInit() {
    super.ngOnInit();
    this.initDateTime(this.formProperty.value);
     (this.parserFormatter as unknown as ConfigureDateTime).setDateTime(this.dateTime);
    (this.dateAdapter as unknown as ConfigureDateTime).setDateTime(this.dateTime);
    (this.timeAdapter as unknown as ConfigureDateTime).setDateTime(this.dateTime);
  }

  initDateTime(isoDateString: string) {
    const date = new Date(isoDateString);
    if(isValidDate(date)) {
      this.dateTime.date = date;
    }
  }

  updateValue(event) {
    if(this.dateTime.date && !isNaN(this.dateTime.date.getTime())) {
      this.formProperty.setValue((this.dateTime.date.toISOString()), false);
    }
  }
}
