import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandablePanelsComponent } from './expandable-panels.component';
import {CommonTestingModule} from '../../testing/common-testing.module';

describe('ExpandablePanelsComponent', () => {
  let component: ExpandablePanelsComponent;
  let fixture: ComponentFixture<ExpandablePanelsComponent>;

  CommonTestingModule.setUpTestBed(ExpandablePanelsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpandablePanelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
