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
