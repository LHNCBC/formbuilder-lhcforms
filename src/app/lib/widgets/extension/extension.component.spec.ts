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
});
