/**
 * Helper class for date and datetime related functions.
 */
import {NgbDateStruct, NgbTimeStruct} from '@ng-bootstrap/ng-bootstrap';
import {format} from 'date-fns';

export interface DateTime {
  dateStruct: NgbDateStruct;
  timeStruct?: NgbTimeStruct;
  millis?: number;
}

export class DateUtil {
  // Copied from FHIR spec.
  static isoDateTimeRE   = /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.([0-9]{1,9}))?)?)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)?)?)?/;
  // Modified from above to display local date/time. Keep matching indices the same
  static localDateTimeRE = /^\s*([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])( ([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.([0-9]{1,3}))?)?)?)?\s*([aApP][mM])?\s*$/;
  static dateRE = /^\s*([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?\s*$/;
  /**
   * Check the validity of the date object. Invalid date objects return false.
   * @param date - Date object.
   */
  static isValidDate(date: Date): boolean {
    return date && !isNaN(date.getTime());
  }

  /**
   * Check if it is a valid date format.
   * @param dateString - string representation of date.
   */
  static isValidFormat(dateString: string): boolean {
    let ret = false;
    if(this.localDateTimeRE.test(dateString)) {
      ret = true;
    }
    return ret;
  }

  /**
   * Parse ISO string to DateTime structure.
   * @param isoDateString - Zulu time representation.
   */
  static parseISOToDateTime(isoDateString: string, dateOnly = false): DateTime {
    const regex = dateOnly ? DateUtil.dateRE : DateUtil.isoDateTimeRE;
    return DateUtil.parseToDateTime(isoDateString, regex);
  }

  /**
   * Parse local date string to DateTime structure.
   * @param localDateString - Local representation of datetime.
   */
  static parseLocalToDateTime(localDateString: string, dateOnly = false): DateTime {
    const regex = dateOnly ? DateUtil.dateRE : DateUtil.localDateTimeRE;
    return DateUtil.parseToDateTime(localDateString, regex);
  }

  /**
   * Parse input string to DateTime structure using dateTimeRE.
   * @param dateString - Date string.
   * @param dateTimeRE - One of the two regular expression, for ISO or local
   */
  static parseToDateTime(dateString: string, dateTimeRE: RegExp): DateTime {
    const matches = dateTimeRE.exec(dateString);
    const yearInd = 1;
    const monthInd = 5;
    const dayInd = 7;
    const timeInd = 8;
    const millisInd = 13;

    const ret = {
      dateStruct: null,
      timeStruct: null,
      millis: NaN
    }

    const date = dateString?.trim() ? new Date(dateString) : null;
    const isValid = DateUtil.isValidDate(date);
    if(isValid && matches && matches[timeInd]) {
        ret.dateStruct = {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate()
        }
        ret.timeStruct = {
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds()
        }
        ret.millis = parseInt(matches[millisInd], 10);
    }
    else if(isValid && matches) {
      ret.dateStruct = {
        year: matches[yearInd] ? parseInt(matches[yearInd], 10) : null,
        month: matches[monthInd] ? parseInt(matches[monthInd], 10) : null,
        day: matches[dayInd] ? parseInt(matches[dayInd], 10) : null
      };
    }

    return ret;
  }

  /**
   * Format ISO string.
   * @param dateTime - Input datetime structure
   */
  static formatToISO(dateTime: DateTime): string {
    let ret = '';
    const date = DateUtil.getDate(dateTime);
    if(dateTime && dateTime.dateStruct && dateTime.dateStruct.year) {
      const ds = dateTime.dateStruct;
      const formatSpec = `yyyy${ds?.month || ds?.day ? '-MM' : ''}${ds?.day ? '-dd' : ''}`;
      ret = format(date, formatSpec);
      if(dateTime.timeStruct && dateTime.timeStruct.hour !== null && dateTime.timeStruct.minute !== null) {
        ret = date.toISOString();
        if(Number.isNaN(dateTime.millis)) {
          ret = ret.replace(/\.[0-9]{3}/, '');
        }
      }
    }
    return ret;
  }

  /**
   * Get a date object from DateTime structure.
   * @param dateTime - DateTime structure.
   */
  static getDate(dateTime: DateTime): Date {
    let ret: Date = new Date(NaN);
    if(dateTime && dateTime.dateStruct && dateTime.dateStruct.year) {
      const ds = dateTime.dateStruct;
      const ts = dateTime.timeStruct;
      ret = new Date(ds.year, (ds?.month > 0) ? ds.month - 1 : 0, ds?.day || 1,
        ts?.hour || 0, ts?.minute || 0, ts?.second || 0, dateTime.millis || 0);
    }
    return ret;
  }

  /**
   * Format local time string using DateTime structure.
   * @param dateTime - DateTime structure.
   */
  static formatToLocal(dateTime: DateTime): string {
    let ret = '';
    if(dateTime && dateTime.dateStruct && dateTime.dateStruct.year) {
      const ds = dateTime.dateStruct;
      const ts = dateTime.timeStruct;
      let formatSpec = `${ds.year ? 'yyyy' : ''}${ds.month ? '-MM' : ''}${ds.day ? '-dd' : ''}`;
      if(dateTime.timeStruct && dateTime.timeStruct.hour !== null && dateTime.timeStruct.minute !== null) {
        formatSpec += ` hh:mm${ts.second !== null ? ':ss' : ''}${!Number.isNaN(dateTime.millis) ? '.SSS' : ''} a`;
      }

      ret = format(DateUtil.getDate(dateTime), formatSpec);
    }
    return ret;
  }
}
