import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringComponent } from './string.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

xdescribe('StringComponent', () => {
  let component: StringComponent;
  let fixture: ComponentFixture<StringComponent>;

  CommonTestingModule.setUpTestBed(StringComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(StringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
