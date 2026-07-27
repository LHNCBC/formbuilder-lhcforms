import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {UsageContextObjComponent} from './usage-context-obj.component';
import type {UsageContextEditModel} from '../usage-context/usage-context.types';

describe('UsageContextObjComponent', () => {
  let component: UsageContextObjComponent;
  let fixture: ComponentFixture<UsageContextObjComponent>;

  CommonTestingModule.setUpTestBedConfig({
    imports: [UsageContextObjComponent]
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(UsageContextObjComponent);
    component = fixture.componentInstance;
    component.model = {
      code: {code: 'focus'},
      __$valueType: 'valueCodeableConcept',
      valueCodeableConcept: {text: 'Cardiology'}
    };
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the schema form and capture its root property', () => {
    expect(component).toBeTruthy();
    expect(component.sfFormRootProperty).toBe(component.sfForm.rootProperty as typeof component.sfFormRootProperty);
  });

  it('should forward schema-form value changes', () => {
    const value: UsageContextEditModel = {
      code: {code: 'focus'},
      valueCodeableConcept: {text: 'Neurology'}
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
