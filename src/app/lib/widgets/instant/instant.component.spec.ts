import {ensureInstantPrecision} from './instant-util';
import {DateTime} from '../../date-util';
import {InstantComponent} from './instant.component';
import {DatetimeComponent} from '../datetime/datetime.component';

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

  describe('suppressInvalidValue', () => {
    let component: InstantComponent;
    let updateValueSpy: jasmine.Spy;
    let superSpy: jasmine.Spy;

    beforeEach(() => {
      // Build a minimally-stubbed instance to exercise the override in isolation.
      component = Object.create(InstantComponent.prototype) as InstantComponent;
      updateValueSpy = spyOn(component, 'updateValue').and.callFake(() => {});
      // Stub the base implementation so we can assert it ran without needing
      // an actual DOM event/form-property pipeline.
      superSpy = spyOn(DatetimeComponent.prototype, 'suppressInvalidValue').and.callFake(() => {});
    });

    function setComponentState(dateTime: DateTime, formValue: string | null) {
      (component as any).dateTime = dateTime;
      (component as any).formProperty = {value: formValue};
    }

    it('should leave a complete instant value untouched', () => {
      const dateTime: DateTime = {
        dateStruct: {year: 2026, month: 5, day: 21},
        timeStruct: {hour: 10, minute: 30, second: 0},
        millis: NaN
      };
      setComponentState(dateTime, '2026-05-21T10:30:00Z');

      component.suppressInvalidValue(new Event('blur'));

      expect(superSpy).toHaveBeenCalled();
      expect(updateValueSpy).not.toHaveBeenCalled();
      expect(dateTime.timeStruct).toEqual({hour: 10, minute: 30, second: 0});
    });

    it('should do nothing when the base class cleared the form value', () => {
      const dateTime: DateTime = {
        dateStruct: {year: 2026, month: 5, day: 21},
        timeStruct: null,
        millis: NaN
      };
      setComponentState(dateTime, null);

      component.suppressInvalidValue(new Event('blur'));

      expect(superSpy).toHaveBeenCalled();
      expect(updateValueSpy).not.toHaveBeenCalled();
      expect(dateTime.timeStruct).toBeNull();
    });

    it('should default time to 00:00:00 for a surviving date-only value', () => {
      const dateTime: DateTime = {
        dateStruct: {year: 2026, month: 5, day: 21},
        timeStruct: null,
        millis: NaN
      };
      setComponentState(dateTime, '2026-05-21');

      component.suppressInvalidValue(new Event('blur'));

      expect(superSpy).toHaveBeenCalled();
      expect(dateTime.timeStruct).toEqual({hour: 0, minute: 0, second: 0});
      expect(updateValueSpy).toHaveBeenCalledOnceWith(dateTime.timeStruct);
    });

    it('should skip normalization when the date is incomplete', () => {
      const dateTime: DateTime = {
        dateStruct: {year: 2026, month: null, day: null} as any,
        timeStruct: null,
        millis: NaN
      };
      setComponentState(dateTime, '2026');

      component.suppressInvalidValue(new Event('blur'));

      expect(superSpy).toHaveBeenCalled();
      expect(updateValueSpy).not.toHaveBeenCalled();
      expect(dateTime.timeStruct).toBeNull();
    });
  });
});
