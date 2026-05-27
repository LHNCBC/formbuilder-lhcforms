import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableEditRowInDlgComponent } from './table-edit-row-in-dlg.component';
import {TableService} from "../../../services/table.service";
import {CommonTestingModule} from "../../../testing/common-testing.module";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FormService} from "../../../services/form.service";
import {ArrayProperty, PropertyGroup} from "@lhncbc/ngx-schema-form";
import sampleQ from '../../../../../cypress/fixtures/sample.R4.json';

describe('TableEditRowInDlgComponent', () => {
  let component: TableEditRowInDlgComponent;
  let fixture: ComponentFixture<TableEditRowInDlgComponent>;
  let formService: FormService;

  CommonTestingModule.setUpTestBedConfig({
    imports: [TableEditRowInDlgComponent],
    providers: [
      TableService,
      {provide: MAT_DIALOG_DATA, useValue: {}},
      {provide: MatDialogRef, useValue: {}},
    ]
  });

  beforeEach(() => {
    formService = TestBed.inject<FormService>(FormService);
    const schema = formService.getItemSchema();
    const rootProperty = CommonTestingModule.createProperty(schema, sampleQ.item[0]) as PropertyGroup;

    fixture = TestBed.createComponent(TableEditRowInDlgComponent);
    component = fixture.componentInstance;
    component.formProperty = rootProperty.getProperty('extension') as ArrayProperty;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
