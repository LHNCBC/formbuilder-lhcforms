import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementChooserComponent } from './element-chooser.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

xdescribe('ElementChooserComponent', () => {
  let component: ElementChooserComponent;
  let fixture: ComponentFixture<ElementChooserComponent>;

  CommonTestingModule.setUpTestBed(ElementChooserComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ElementChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
