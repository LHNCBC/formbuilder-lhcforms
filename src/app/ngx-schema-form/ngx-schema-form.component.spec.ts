import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxSchemaFormComponent } from './ngx-schema-form.component';
import {CommonTestingModule} from '../testing/common-testing.module';

describe('NgxSchemaFormComponent', () => {
  let component: NgxSchemaFormComponent;
  let fixture: ComponentFixture<NgxSchemaFormComponent>;

  CommonTestingModule.setUpTestBed(NgxSchemaFormComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxSchemaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
