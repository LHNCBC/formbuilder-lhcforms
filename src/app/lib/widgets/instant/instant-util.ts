import {NgbDateStruct, NgbTimeStruct} from '@ng-bootstrap/ng-bootstrap';

import {DateTime} from '../../date-util';

/**
 * Ensures a complete date has a time value with at least seconds precision.
 *
 * @param dateTime - Date/time structure to normalize.
 * @returns true when the structure was changed.
 */
export function ensureInstantPrecision(dateTime: DateTime): boolean {
  const ds: NgbDateStruct = dateTime?.dateStruct;
  if(!ds?.year || !ds?.month || !ds?.day) {
    return false;
  }

  const timeStruct = dateTime.timeStruct;
  const normalizedTime: NgbTimeStruct = {
    hour: timeStruct?.hour ?? 0,
    minute: timeStruct?.minute ?? 0,
    second: timeStruct?.second ?? 0
  };
  const changed = !timeStruct ||
    timeStruct.hour !== normalizedTime.hour ||
    timeStruct.minute !== normalizedTime.minute ||
    timeStruct.second !== normalizedTime.second;

  dateTime.timeStruct = normalizedTime;
  if(dateTime.millis === undefined || dateTime.millis === null) {
    dateTime.millis = NaN;
  }

  return changed;
}

