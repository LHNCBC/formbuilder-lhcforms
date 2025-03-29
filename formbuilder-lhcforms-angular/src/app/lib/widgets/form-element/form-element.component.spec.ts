import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppFormElementComponent } from './form-element.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

xdescribe('FormElementComponent', () => {
  let component: AppFormElementComponent;
  let fixture: ComponentFixture<AppFormElementComponent>;

  CommonTestingModule.setUpTestBed(AppFormElementComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(AppFormElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
