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
import {
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_COLUMN_COUNT_LEGACY
} from '../../constants/constants';

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

  it('should not treat widget-owned extension URLs as disabled inside extension dialogs', () => {
    component.formProperty = {
      findRoot: () => ({
        schema: {
          formLayout: {targetPage: 'extensionResource'},
          properties: {
            proxyField: {
              widget: {
                extensionUrl: 'http://example.org/widget-owned'
              }
            }
          }
        }
      })
    } as any;

    expect(component.isExtensionUrlOwnedByWidget('http://example.org/widget-owned')).toBeFalse();
  });

  it('should treat widget-owned extension URLs as disabled outside extension dialogs', () => {
    component.formProperty = {
      findRoot: () => ({
        schema: {
          formLayout: {targetPage: 'itemLevel'},
          properties: {
            proxyField: {
              widget: {
                extensionUrl: 'http://example.org/widget-owned'
              }
            }
          }
        }
      })
    } as any;

    expect(component.isExtensionUrlOwnedByWidget('http://example.org/widget-owned')).toBeTrue();
  });

  it('should enable choice-layout extensions when the current schema does not own them', () => {
    component.formProperty = {
      value: [{url: EXTENSION_URL_COLUMN_COUNT}],
      properties: [{value: {url: EXTENSION_URL_COLUMN_COUNT}}],
      findRoot: () => ({schema: formService.getFormLevelSchema()})
    } as any;

    expect(component._isDisabled(component.formProperty, 0)).toBeFalse();

    component.hideUneditableRows();
    expect(component.hideRows.size).toBe(0);
  });

  it('should disable and hide canonical and legacy choice-layout extensions owned by the item schema', () => {
    const urls = [
      EXTENSION_URL_CHOICE_ORIENTATION,
      EXTENSION_URL_COLUMN_COUNT,
      EXTENSION_URL_COLUMN_COUNT_LEGACY
    ];
    component.formProperty = {
      value: urls.map((url) => ({url})),
      properties: urls.map((url) => ({value: {url}})),
      findRoot: () => ({schema: formService.getItemSchema()})
    } as any;

    urls.forEach((_, index) => {
      expect(component._isDisabled(component.formProperty, index)).toBeTrue();
    });

    component.hideUneditableRows();
    expect(Array.from(component.hideRows)).toEqual([0, 1, 2]);
  });

  it('should enable and show widget URLs inside the generic extension editor', () => {
    component.formProperty = {
      value: [{url: EXTENSION_URL_COLUMN_COUNT}],
      properties: [{value: {url: EXTENSION_URL_COLUMN_COUNT}}],
      findRoot: () => ({
        schema: {
          formLayout: {targetPage: 'extensionResource'},
          properties: {
            proxyField: {
              widget: {extensionUrl: EXTENSION_URL_COLUMN_COUNT}
            }
          }
        }
      })
    } as any;

    expect(component._isDisabled(component.formProperty, 0)).toBeFalse();

    component.hideUneditableRows();
    expect(component.hideRows.size).toBe(0);
  });
});
