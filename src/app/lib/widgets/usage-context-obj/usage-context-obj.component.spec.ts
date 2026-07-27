import {EventEmitter} from '@angular/core';
import {UsageContextObjComponent} from './usage-context-obj.component';
import type {UsageContextEditModel} from '../usage-context/usage-context.types';

describe('UsageContextObjComponent', () => {
  let component: UsageContextObjComponent;

  beforeEach(() => {
    component = Object.create(UsageContextObjComponent.prototype);
    component.changed = new EventEmitter<UsageContextEditModel>();
    component.validityChanged = new EventEmitter<boolean>();
  });

  it('should forward schema-form value changes', () => {
    const value: UsageContextEditModel = {
      code: {code: 'focus'},
      valueCodeableConcept: {text: 'Cardiology'}
    };
    spyOn(component.changed, 'emit');

    component.handleChange(value);

    expect(component.changed.emit).toHaveBeenCalledOnceWith(value);
  });

  it('should forward schema-form validity changes', () => {
    spyOn(component.validityChanged, 'emit');

    component.handleValidityChange(false);

    expect(component.validityChanged.emit).toHaveBeenCalledOnceWith(false);
  });
});
