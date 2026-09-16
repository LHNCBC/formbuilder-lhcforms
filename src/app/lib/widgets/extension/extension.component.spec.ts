import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionComponent } from './extension.component';
import {TableService} from "../../../services/table.service";
import {FormService} from "../../../services/form.service";
import {CommonTestingModule} from "../../../testing/common-testing.module";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ArrayProperty, ISchema, PropertyGroup} from "@lhncbc/ngx-schema-form";
import sampleQ from '../../../../../cypress/fixtures/sample.R4.json';
import {DialogData} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {ExtensionEditorScope} from '../../../services/extensions.service';
import {
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_COLUMN_COUNT_LEGACY
} from '../../constants/constants';

describe('ExtensionComponent', () => {
  let component: ExtensionComponent;
  let fixture: ComponentFixture<ExtensionComponent>;
  let formService: FormService;
  const parentDialogData: Partial<DialogData> = {};

  CommonTestingModule.setUpTestBedConfig({
    imports: [ExtensionComponent],
    providers: [
      TableService,
      {provide: MAT_DIALOG_DATA, useValue: parentDialogData},
      {provide: MatDialogRef, useValue: {}},
    ]
  });

  beforeEach(() => {
    delete parentDialogData.extensionEditorScope;
    formService = TestBed.inject<FormService>(FormService);
    fixture = TestBed.createComponent(ExtensionComponent);
    component = fixture.componentInstance;
    setExtensionProperty(formService.getFormLevelSchema(), sampleQ);
  });

  function setExtensionProperty(schema: ISchema, model: unknown): void {
    const rootProperty = CommonTestingModule.createProperty(schema, model) as PropertyGroup;
    component.formProperty = rootProperty.getProperty('extension') as ArrayProperty;
  }

  function openedEditorScope(): ExtensionEditorScope {
    const openSpy = spyOn(component.matDialogService, 'open').and.returnValue({} as MatDialogRef<unknown>);

    component.openDialog({arrayProperty: component.formProperty, rowIndex: -1}, component.dialogComponentType);

    return (openSpy.calls.mostRecent().args[1].data as DialogData).extensionEditorScope as ExtensionEditorScope;
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should identify a form-level extension editor from its root schema', () => {
    expect(openedEditorScope()).toBe('form');
  });

  it('should identify an item-level extension editor from its root schema', () => {
    setExtensionProperty(formService.getItemSchema(), sampleQ.item[0]);

    expect(openedEditorScope()).toBe('item');
  });

  it('should inherit form scope in a nested extension editor', () => {
    parentDialogData.extensionEditorScope = 'form';
    setExtensionProperty(formService.getExtensionSchema(), {url: 'http://example.org/outer', extension: []});

    expect(openedEditorScope()).toBe('form');
  });

  it('should inherit item scope in a nested extension editor', () => {
    parentDialogData.extensionEditorScope = 'item';
    setExtensionProperty(formService.getExtensionSchema(), {url: 'http://example.org/outer', extension: []});

    expect(openedEditorScope()).toBe('item');
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
