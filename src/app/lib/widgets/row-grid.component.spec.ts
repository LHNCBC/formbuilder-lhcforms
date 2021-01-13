import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RowGridComponent } from './row-grid.component';
import {CommonTestingModule} from '../../testing/common-testing.module';

describe('RowGridComponent', () => {
  let component: RowGridComponent;
  let fixture: ComponentFixture<RowGridComponent>;

  CommonTestingModule.setUpTestBed(RowGridComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RowGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
