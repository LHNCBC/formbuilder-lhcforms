import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectComponent } from './select.component';

xdescribe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('SelectComponent invalid styling', () => {
  let component: SelectComponent;

  beforeEach(() => {
    component = Object.create(SelectComponent.prototype);
    component.errors = [{code: 'required'}] as any;
    component.schema = {widget: {}} as any;
    component.control = {pristine: true} as any;
    component.formProperty = {value: null} as any;
  });

  it('should keep the default invalid style for an untouched empty value', () => {
    expect(component.shouldShowInvalidStyle()).toBeTrue();
  });

  it('should suppress the invalid style for an opted-in untouched empty value', () => {
    component.schema.widget.suppressEmptyInvalidStyle = true;

    expect(component.shouldShowInvalidStyle()).toBeFalse();
  });

  it('should show the invalid style after an opted-in control is changed', () => {
    component.schema.widget.suppressEmptyInvalidStyle = true;
    component.control = {pristine: false} as any;

    expect(component.shouldShowInvalidStyle()).toBeTrue();
  });

  it('should show the invalid style for an opted-in nonempty invalid value', () => {
    component.schema.widget.suppressEmptyInvalidStyle = true;
    component.formProperty = {value: 'invalid'} as any;

    expect(component.shouldShowInvalidStyle()).toBeTrue();
  });

  it('should not show the invalid style when there are no errors', () => {
    component.errors = [];

    expect(component.shouldShowInvalidStyle()).toBeFalse();
  });
});

describe('SelectComponent array values with null placeholders', () => {
  let component: SelectComponent;
  let control: {value: any, setValue: jasmine.Spy, markAsDirty: jasmine.Spy, markAsTouched: jasmine.Spy};

  beforeEach(() => {
    component = Object.create(SelectComponent.prototype);
    control = {
      value: ['Patient', null, 'Group'],
      setValue: jasmine.createSpy('setValue'),
      markAsDirty: jasmine.createSpy('markAsDirty'),
      markAsTouched: jasmine.createSpy('markAsTouched')
    };
    component.control = control as any;
  });

  it('should not show null placeholders as selected values', () => {
    expect(component.selectedArrayValues).toEqual(['Patient', 'Group']);
  });

  it('should keep null placeholders when a selected value is removed', () => {
    component.removeSelectedValue('Patient');

    expect(control.setValue).toHaveBeenCalledOnceWith([null, 'Group']);
  });
});
