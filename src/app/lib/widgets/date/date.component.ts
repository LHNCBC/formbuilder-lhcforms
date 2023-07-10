import {Component, Injectable, OnInit} from '@angular/core';
import {NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbTimeAdapter, NgbTimeStruct} from '@ng-bootstrap/ng-bootstrap';
import {StringComponent} from '../string/string.component';
import {faCalendar} from '@fortawesome/free-solid-svg-icons';
/**
 * Example of a String Time adapter
 */

/**
 * This Service handles how the date is represented in scripts i.e. ngModel.
 */
@Injectable()
export class LfbDateAdapter extends NgbDateAdapter<string> {
  static readonly DELIMITER = '-';

  static parse(value: string): NgbDateStruct | null {
    if (value) {
      const d = Date.parse(value);
      const date = value.split(LfbDateAdapter.DELIMITER);
      return {
        year: parseInt(date[0], 10),
        month: parseInt(date[1], 10),
        day: parseInt(date[2], 10),
      };
    }
    return null;
  }

  static format(date: NgbDateStruct | null): string {
    return date ?
      date.year + LfbDateAdapter.DELIMITER + date.month.toString().padStart(2, '0')
        + LfbDateAdapter.DELIMITER + date.day.toString().padStart(2, '0')
      : '';
  }

  fromModel(value: string | null): NgbDateStruct | null {
    return LfbDateAdapter.parse(value);
  }

  toModel(date: NgbDateStruct | null): string | null {
    return LfbDateAdapter.format(date);
  }

}

/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 */
@Injectable()
export class LfbDateParserFormatter extends NgbDateParserFormatter {

  parse(value: string): NgbDateStruct {
    return LfbDateAdapter.parse(value);
  }

  format(date: NgbDateStruct | null): string {
    return LfbDateAdapter.format(date);
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
  model: NgbDateStruct;
  dateIcon = faCalendar;
  dateRE = '([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?';

  constructor() {
    super();
  }
}
