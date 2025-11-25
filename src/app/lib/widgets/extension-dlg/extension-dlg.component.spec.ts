import { ComponentFixture, TestBed } from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FormPropertyFactory, ArrayProperty, ISchema} from "@lhncbc/ngx-schema-form";
import { FormService } from "../../../services/form.service";
import { ExtensionDlgComponent } from './extension-dlg.component';
import {CommonTestingModule} from "../../../testing/common-testing.module";
import {DialogData} from "../table-edit-row-in-dlg/table-edit-row-in-dlg.component";
import fhir from "fhir/r4";


describe('ExtensionDlgComponent', () => {
  let component: ExtensionDlgComponent;
  let fixture: ComponentFixture<ExtensionDlgComponent>;
  let formService: FormService;
  let extSchema: ISchema;
  let inputExt: fhir.Extension [] = [
    {url: 'http://some.extension.org', valueString: 'some value'}
  ];
  let formPropertyFactory: FormPropertyFactory;
  let arrayProperty: ArrayProperty;
  let data: DialogData;

  CommonTestingModule.setUpTestBedConfig({
    imports: [ExtensionDlgComponent],
    providers: [
      {provide: MAT_DIALOG_DATA, useValue: {}},
      {provide: MatDialogRef, useValue: {}},
    ]
  });

  beforeEach(() => {
    // formPropertyFactory = TestBed.inject<FormPropertyFactory>(FormPropertyFactory);
    formPropertyFactory = CommonTestingModule.formPropertyFactory;
    formService = TestBed.inject<FormService>(FormService);
    extSchema = formService.getFormLevelSchema();
    const rootProperty = formPropertyFactory.createProperty(extSchema) as ArrayProperty;
    arrayProperty = formPropertyFactory.createProperty(extSchema.properties.extension, rootProperty, 'extension') as ArrayProperty;
    arrayProperty.setValue(inputExt, false);
    data = {
      arrayProperty,
      rowIndex: 0,
    } as DialogData;
    fixture = TestBed.createComponent(ExtensionDlgComponent);
    component = fixture.componentInstance;
    component.data = data;
    fixture.detectChanges();
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');
    expect(urlInput.value).toBe('http://some.extension.org');
    urlInput.value = 'http://changed.extension.org';
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    expect(component.changedValue.url).toBe('http://changed.extension.org');
  });
});
