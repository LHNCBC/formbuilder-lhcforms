import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldsComponent } from './form-fields.component';
import {CommonTestingModule} from '../testing/common-testing.module';

xdescribe('FormFieldsComponent', () => {
  let component: FormFieldsComponent;
  let fixture: ComponentFixture<FormFieldsComponent>;

  CommonTestingModule.setUpTestBed(FormFieldsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FormFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
