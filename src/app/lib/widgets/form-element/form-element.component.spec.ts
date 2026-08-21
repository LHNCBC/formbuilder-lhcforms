import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppFormElementComponent } from './form-element.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

describe('FormElementComponent', () => {
  let component: AppFormElementComponent;
  let fixture: ComponentFixture<AppFormElementComponent>;

  CommonTestingModule.setUpTestBed(AppFormElementComponent, true);

  beforeEach(() => {
    fixture = TestBed.createComponent(AppFormElementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput(
      'formProperty',
      CommonTestingModule.createProperty({type: 'string'}, 'value')
    );
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should not fail when the form property is temporarily unavailable', () => {
    expect(() => fixture.detectChanges()).not.toThrow();

    fixture.componentRef.setInput(
      'formProperty',
      CommonTestingModule.createProperty({type: 'string'}, 'value')
    );

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
