import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionObjComponent } from './extension-obj.component';
import {CommonTestingModule} from "../../../testing/common-testing.module";

describe('SingleExtensionComponent', () => {
  let component: ExtensionObjComponent;
  let fixture: ComponentFixture<ExtensionObjComponent>;

  CommonTestingModule.setUpTestBedConfig({import: [ExtensionObjComponent]});

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtensionObjComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
