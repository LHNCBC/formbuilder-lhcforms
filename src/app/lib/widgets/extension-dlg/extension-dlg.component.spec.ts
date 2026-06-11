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
import {AppFormElementComponent} from "../form-element/form-element.component";
import {LfbArrayComponent} from "../lfb-array/lfb-array.component";


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

  async function createDialog(extensions: fhir.Extension[], rowIndex = 0) {
    const rootProperty = formPropertyFactory.createProperty(extSchema) as ArrayProperty;
    arrayProperty = formPropertyFactory.createProperty(extSchema.properties.extension, rootProperty, 'extension') as ArrayProperty;
    arrayProperty.setValue(extensions.map((ext) => extensionsService.updateExtension(ext)), false);
    data = {
      arrayProperty,
      rowIndex,
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

  it('should render one period date range per ContactDetail telecom item after adding an item', async () => {
    await createDialog([], -1);

    const extensionObj = fixture.debugElement.query(By.directive(ExtensionObjComponent))
      .componentInstance as ExtensionObjComponent;
    const rootProperty = extensionObj.sfFormRootProperty;

    const categoryElement = fixture.debugElement.queryAll(By.directive(AppFormElementComponent))
      .find((el) => el.componentInstance.formProperty === rootProperty.getProperty('__$valueTypeCategory'));
    const metadataTypeRadio = Array.from(categoryElement.nativeElement.querySelectorAll('input[type="radio"]'))
      .find((input: HTMLInputElement) => input.id.endsWith('__$valueMetadataType')) as HTMLInputElement;
    expect(metadataTypeRadio).toBeDefined();
    metadataTypeRadio.click();

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const metadataTypeElement = fixture.debugElement.queryAll(By.directive(AppFormElementComponent))
      .find((el) => el.componentInstance.formProperty === rootProperty.getProperty('__$valueMetadataType'));
    const metadataTypeSelect: HTMLSelectElement = metadataTypeElement.nativeElement.querySelector('select');
    const contactDetailOption = Array.from(metadataTypeSelect.options)
      .find((option) => option.value.includes('valueContactDetail'));
    expect(contactDetailOption).toBeDefined();
    metadataTypeSelect.value = contactDetailOption!.value;
    metadataTypeSelect.dispatchEvent(new Event('change'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const telecomProperty: any = rootProperty.getProperty('valueContactDetail/telecom');
    expect(telecomProperty.properties.length).toBe(1);
    const valueProperty = telecomProperty.properties[0].getProperty('value');
    const valueElement = fixture.debugElement.queryAll(By.directive(AppFormElementComponent))
      .find((el) => el.componentInstance.formProperty === valueProperty);
    const valueInput: HTMLInputElement = valueElement.nativeElement.querySelector('input.form-control');
    valueInput.value = 'v1';
    valueInput.dispatchEvent(new InputEvent('input'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const telecomArray = fixture.debugElement.queryAll(By.directive(LfbArrayComponent))
      .find((el) => el.componentInstance.formProperty === telecomProperty);
    const addButton: HTMLButtonElement = telecomArray.nativeElement.querySelector('button.array-add-button');
    addButton.click();

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const telecomItems = fixture.nativeElement.querySelectorAll(
      'lfb-extension-obj lfb-array lfb-form-element > div > lfb-element-chooser > lfb-object'
    );
    expect(telecomItems.length).toBe(2);
    expect(telecomItems[0].querySelectorAll('lfb-date-range').length)
      .withContext('the first telecom item should keep a single Period date-range widget')
      .toBe(1);
    const firstPeriod = telecomItems[0].querySelector('lfb-date-range') as HTMLElement;
    expect(getDateRangeInputs(firstPeriod).length)
      .withContext('the first telecom Period date-range widget should only contain Start and End inputs')
      .toBe(2);
    expect(fixture.nativeElement.querySelectorAll('lfb-extension-obj lfb-date-range').length)
      .withContext('each telecom item should render one Period date-range widget')
      .toBe(2);
  });
});
