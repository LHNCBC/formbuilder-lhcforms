import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StepperGridComponent } from './stepper-grid.component';
import {CommonTestingModule, TestComponent} from '../../testing/common-testing.module';

describe('StepperGridComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  CommonTestingModule.setupTestBedOne();

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
