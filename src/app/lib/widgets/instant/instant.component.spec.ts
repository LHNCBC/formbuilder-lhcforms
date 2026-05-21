import {ensureInstantPrecision} from './instant-util';
import {DateTime} from '../../date-util';

describe('InstantComponent', () => {
  it('should add zero time to a complete date', () => {
    const dateTime: DateTime = {
      dateStruct: {year: 2026, month: 5, day: 21},
      timeStruct: null,
      millis: NaN
    };

    expect(ensureInstantPrecision(dateTime)).toBeTrue();
    expect(dateTime.timeStruct).toEqual({hour: 0, minute: 0, second: 0});
  });

  it('should fill missing time fields with zeros', () => {
    const dateTime: DateTime = {
      dateStruct: {year: 2026, month: 5, day: 21},
      timeStruct: {hour: 9, minute: null, second: null} as any,
      millis: NaN
    };

    expect(ensureInstantPrecision(dateTime)).toBeTrue();
    expect(dateTime.timeStruct).toEqual({hour: 9, minute: 0, second: 0});
  });

  it('should not add time to partial dates', () => {
    const dateTime: DateTime = {
      dateStruct: {year: 2026, month: null, day: null} as any,
      timeStruct: null,
      millis: NaN
    };

    expect(ensureInstantPrecision(dateTime)).toBeFalse();
    expect(dateTime.timeStruct).toBeNull();
  });
});
