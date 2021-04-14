import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import { BasePageComponent } from './base-page.component';
import {CommonTestingModule} from '../testing/common-testing.module';

describe('BasePageComponent', () => {
  let component: BasePageComponent;
  let fixture: ComponentFixture<BasePageComponent>;

  CommonTestingModule.setUpTestBed(BasePageComponent);
  beforeEach(() => {
    fixture = TestBed.createComponent(BasePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
