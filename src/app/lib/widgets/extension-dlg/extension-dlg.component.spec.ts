import { ComponentFixture, TestBed } from '@angular/core/testing';
import {By} from "@angular/platform-browser";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FormPropertyFactory, ArrayProperty, ISchema} from "@lhncbc/ngx-schema-form";
import { FormService } from "../../../services/form.service";
import {ExtensionsService} from "../../../services/extensions.service";
import { ExtensionDlgComponent } from './extension-dlg.component';
import {CommonTestingModule} from "../../../testing/common-testing.module";
import {DialogData} from "../table-edit-row-in-dlg/table-edit-row-in-dlg.component";
import fhir from "fhir/r4";
import {ExtensionObjComponent} from "../extension-obj/extension-obj.component";


describe('ExtensionDlgComponent', () => {
  let component: ExtensionDlgComponent;
  let fixture: ComponentFixture<ExtensionDlgComponent>;
  let formService: FormService;
  let extensionsService: ExtensionsService;
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

  beforeEach(async () => {
    formPropertyFactory = CommonTestingModule.formPropertyFactory;
    formService = TestBed.inject<FormService>(FormService);
    extensionsService = TestBed.inject<ExtensionsService>(ExtensionsService);
    extSchema = formService.getFormLevelSchema();
    await createDialog(inputExt);
  });

  async function createDialog(extensions: fhir.Extension[]) {
    const rootProperty = formPropertyFactory.createProperty(extSchema) as ArrayProperty;
    arrayProperty = formPropertyFactory.createProperty(extSchema.properties.extension, rootProperty, 'extension') as ArrayProperty;
    arrayProperty.setValue(extensions.map((ext) => extensionsService.updateExtension(ext)), false);
    data = {
      arrayProperty,
      rowIndex: 0,
    } as DialogData;
    fixture = TestBed.createComponent(ExtensionDlgComponent);
    component = fixture.componentInstance;
    component.data = data;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function getDateRangeInputs(dateRange: HTMLElement): NodeListOf<HTMLInputElement> {
    return dateRange.querySelectorAll('input.form-control');
  }

  function getDateRangeLabelTexts(dateRange: HTMLElement): string[] {
    return Array.from(dateRange.querySelectorAll('lfb-label label'))
      .map((label) => label.textContent?.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  it('should create', async () => {
    expect(component).toBeTruthy();
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');
    expect(urlInput.value).toBe('http://some.extension.org');
    urlInput.value = 'http://changed.extension.org';
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    expect(component.changedValue.url).toBe('http://changed.extension.org');
  });

  it('should render date range widget for an existing valuePeriod extension', async () => {
    await createDialog([{
      url: 'http://some.period.extension.org',
      valuePeriod: {
        start: '2024-01-15',
        end: '2024-12-31'
      }
    }]);

    const dateRange = fixture.nativeElement.querySelector('lfb-extension-obj lfb-date-range');
    expect(dateRange).withContext('valuePeriod should render with DateRangeComponent').not.toBeNull();

    const inputs = getDateRangeInputs(dateRange);
    expect(inputs.length).toBe(2);
    expect(inputs[0].value).toBe('2024-01-15');
    expect(inputs[1].value).toBe('2024-12-31');
    expect(getDateRangeLabelTexts(dateRange)).toEqual(['Value period', 'Start', 'End']);
  });

  it('should render date range widget when value type is changed to Period', async () => {
    const extensionObj = fixture.debugElement.query(By.directive(ExtensionObjComponent))
      .componentInstance as ExtensionObjComponent;

    extensionObj.sfFormRootProperty.getProperty('__$isValueX').setValue(true, false);
    extensionObj.sfFormRootProperty.getProperty('__$valueTypeCategory').setValue('__$valueGeneralPurposeDatatype', false);
    extensionObj.sfFormRootProperty.getProperty('__$valueGeneralPurposeDatatype').setValue('valuePeriod', false);
    extensionObj.handler('__$valueGeneralPurposeDatatype');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(extensionObj.sfFormRootProperty.getProperty('valuePeriod').schema.widget.id).toBe('date-range');
    expect(fixture.nativeElement.querySelector('lfb-extension-obj lfb-date-range'))
      .withContext('Period selection should render DateRangeComponent')
      .not.toBeNull();
  });

  it('should render date range widget for Period descendants of value datatypes', async () => {
    await createDialog([{
      url: 'http://some.address.extension.org',
      valueAddress: {
        city: 'Bethesda',
        period: {
          start: '2024-02-01',
          end: '2024-03-31'
        }
      }
    }]);

    const extensionObj = fixture.debugElement.query(By.directive(ExtensionObjComponent))
      .componentInstance as ExtensionObjComponent;
    const periodProperty = extensionObj.sfFormRootProperty.getProperty('valueAddress/period');
    expect(periodProperty.schema.widget.id).toBe('date-range');

    const dateRange = fixture.nativeElement.querySelector('lfb-extension-obj lfb-date-range');
    expect(dateRange)
      .withContext('valueAddress.period should render with DateRangeComponent')
      .not.toBeNull();

    const inputs = getDateRangeInputs(dateRange);
    expect(inputs.length).toBe(2);
    expect(inputs[0].value).toBe('2024-02-01');
    expect(inputs[1].value).toBe('2024-03-31');
    expect(getDateRangeLabelTexts(dateRange)).toEqual(['Period', 'Start', 'End']);
  });

  it('should render date range widget for deeply nested Period descendants of value datatypes', async () => {
    await createDialog([{
      url: 'http://some.contact-detail.extension.org',
      valueContactDetail: {
        name: 'Support',
        telecom: [{
          system: 'phone',
          value: '555-0100',
          period: {
            start: '2024-04-01',
            end: '2024-05-31'
          }
        }]
      }
    }]);

    const extensionObj = fixture.debugElement.query(By.directive(ExtensionObjComponent))
      .componentInstance as ExtensionObjComponent;
    const contactDetailProperty: any = extensionObj.sfFormRootProperty.getProperty('valueContactDetail');
    const telecomProperty: any = contactDetailProperty.getProperty('telecom');
    const periodProperty = telecomProperty.properties[0].getProperty('period');
    expect(periodProperty.schema.widget.id).toBe('date-range');

    const dateRange = fixture.nativeElement.querySelector('lfb-extension-obj lfb-date-range');
    expect(dateRange)
      .withContext('valueContactDetail.telecom.period should render with DateRangeComponent')
      .not.toBeNull();

    const inputs = getDateRangeInputs(dateRange);
    expect(inputs.length).toBe(2);
    expect(inputs[0].value).toBe('2024-04-01');
    expect(inputs[1].value).toBe('2024-05-31');
    expect(getDateRangeLabelTexts(dateRange)).toEqual(['Period', 'Start', 'End']);
  });
});
