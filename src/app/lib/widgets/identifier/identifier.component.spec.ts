import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentifierComponent } from './identifier.component';
import {TableService} from "../../../services/table.service";
import {FormService} from "../../../services/form.service";
import {CommonTestingModule} from "../../../testing/common-testing.module";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ArrayProperty, PropertyGroup} from "@lhncbc/ngx-schema-form";
import sampleQ from '../../../../../cypress/fixtures/sample.R4.json';

describe('IdentifierComponent', () => {
  let component: IdentifierComponent;
  let fixture: ComponentFixture<IdentifierComponent>;
  let formService: FormService;

  CommonTestingModule.setUpTestBedConfig({
    imports: [IdentifierComponent],
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
    const identifierProperty = rootProperty.getProperty('identifier') as ArrayProperty;

    fixture = TestBed.createComponent(IdentifierComponent);
    component = fixture.componentInstance;
    component.formProperty = identifierProperty;
  });

  xit('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
