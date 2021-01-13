import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonEditorComponent } from './json-editor.component';
import {CommonTestingModule} from '../testing/common-testing.module';

describe('JsonEditorComponent', () => {
  let component: JsonEditorComponent;
  let fixture: ComponentFixture<JsonEditorComponent>;

  CommonTestingModule.setUpTestBed(JsonEditorComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(JsonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
