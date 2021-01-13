import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppControlWidgetComponent } from './app-control-widget.component';
import {CommonTestingModule} from '../../testing/common-testing.module';

describe('AppControlWidgetComponent', () => {
  let component: AppControlWidgetComponent;
  let fixture: ComponentFixture<AppControlWidgetComponent>;

  CommonTestingModule.setUpTestBed(AppControlWidgetComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(AppControlWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
