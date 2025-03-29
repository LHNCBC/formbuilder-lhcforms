import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableWhenSourceComponent } from './enable-when-source.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

xdescribe('EnableWhenSourceComponent', () => {
  let component: EnableWhenSourceComponent;
  let fixture: ComponentFixture<EnableWhenSourceComponent>;

  CommonTestingModule.setUpTestBed(EnableWhenSourceComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(EnableWhenSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
