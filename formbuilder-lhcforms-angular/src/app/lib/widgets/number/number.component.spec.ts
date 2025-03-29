import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberComponent } from './number.component';
import {ISchema} from '@lhncbc/ngx-schema-form';
import {CommonTestingModule, TestComponent} from '../../../testing/common-testing.module';
import {By} from '@angular/platform-browser';

describe('NumberComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  CommonTestingModule.setUpTestBed(TestComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
