import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionComponent } from './extension.component';
import {TableService} from "../../../services/table.service";
import {TableEditRowInDlgComponent} from "../table-edit-row-in-dlg/table-edit-row-in-dlg.component";
import {FormService} from "../../../services/form.service";
import {CommonTestingModule} from "../../../testing/common-testing.module";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import jsonpointer from "jsonpointer";
import {ArrayProperty, PropertyGroup} from "@lhncbc/ngx-schema-form";
import sampleQ from '../../../../../cypress/fixtures/sample.R4.json';
import {FormGroup} from "@angular/forms";

describe('ExtensionComponent', () => {
  let component: ExtensionComponent;
  let fixture: ComponentFixture<ExtensionComponent>;
  let formService: FormService;

  CommonTestingModule.setUpTestBedConfig({
    imports: [ExtensionComponent],
    providers: [
      TableService,
      {provide: MAT_DIALOG_DATA, useValue: {}},
      {provide: MatDialogRef, useValue: {}},
    ]
  });

  beforeEach(() => {
    formService = TestBed.inject<FormService>(FormService);
    const schema = formService.getFormLevelSchema();
    const rootProperty: PropertyGroup = CommonTestingModule.createProperty(schema, sampleQ) as PropertyGroup;
    const extProperty = rootProperty.getProperty('extension') as ArrayProperty;

    fixture = TestBed.createComponent(ExtensionComponent);
    component = fixture.componentInstance;
    component.formProperty = extProperty;
  });

  xit('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
