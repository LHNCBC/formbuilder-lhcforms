import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableEditRowInDlgComponent } from './table-edit-row-in-dlg.component';
import {TableService} from "../../../services/table.service";
import {CommonTestingModule} from "../../../testing/common-testing.module";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FormService} from "../../../services/form.service";
import {ArrayProperty, PropertyGroup} from "@lhncbc/ngx-schema-form";
import sampleQ from '../../../../../cypress/fixtures/sample.R4.json';
import {of} from 'rxjs';
import fhir from 'fhir/r4';

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

  it('should replace row value from dialog result without preserving deleted nested data', () => {
    const schema = formService.getFormLevelSchema();
    const rootProperty = CommonTestingModule.createProperty(schema, {}) as PropertyGroup;
    const extensionProperty = rootProperty.getProperty('extension') as ArrayProperty;
    extensionProperty.setValue([{
      url: 'http://some.contact-detail.extension.org',
      valueContactDetail: {
        name: 'Support',
        telecom: [{
          system: 'phone',
          value: '555-0100'
        }]
      }
    }], false);
    component.formProperty = extensionProperty;

    const submittedValue: fhir.Extension = {
      url: 'http://some.contact-detail.extension.org',
      valueContactDetail: {
        name: 'Support'
      }
    };
    spyOn(component, 'openDialog').and.returnValue({
      afterClosed: () => of(submittedValue)
    } as any);

    component.onEditProperty(0);

    const savedValue = component.formProperty.properties[0].value as fhir.Extension;
    expect(savedValue.valueContactDetail.name).toBe('Support');
    expect(JSON.stringify(savedValue.valueContactDetail.telecom ?? null)).not.toContain('555-0100');
  });

  it('should remove a synthetic empty row without deferred work', () => {
    const placeholder = {value: null};
    const removeItem = jasmine.createSpy('removeItem');
    component.formProperty = {
      properties: [placeholder],
      removeItem
    } as unknown as ArrayProperty;
    component.addDefaultItemIfEmpty = false;

    (component as unknown as {removeSyntheticEmptyRow: () => void}).removeSyntheticEmptyRow();

    expect(removeItem).toHaveBeenCalledOnceWith(placeholder);
  });
});
