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
    component.formProperty = CommonTestingModule.createProperty({type: 'string'}, 'value');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not fail when the form property is temporarily unavailable', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(AppFormElementComponent);
    component = fixture.componentInstance;

    expect(() => fixture.detectChanges()).not.toThrow();

    fixture.componentRef.setInput(
      'formProperty',
      CommonTestingModule.createProperty({type: 'string'}, 'value')
    );

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
