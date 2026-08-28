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
import {
  EXTENSION_URL_CUSTOM_VARIABLE_TYPE,
  EXTENSION_URL_ENTRY_FORMAT,
  EXTENSION_URL_MIME_TYPE,
  EXTENSION_URL_RENDERING_STYLE,
  EXTENSION_URL_RENDERING_XHTML,
  EXTENSION_URL_VARIABLE
} from '../../constants/constants';
import {
  ExtensionCardinalityCandidate,
  ExtensionCardinalityResolution,
  ExtensionCardinalityService
} from '../../../services/extension-cardinality.service';
import {of, Subject} from 'rxjs';
import {FhirService} from '../../../services/fhir.service';


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
  let cardinalityService: ExtensionCardinalityService;
  let fhirService: FhirService;
  let resolveCardinalitySpy: jasmine.Spy;

  CommonTestingModule.setUpTestBedConfig({
    imports: [ExtensionDlgComponent],
    providers: [
      {provide: MAT_DIALOG_DATA, useValue: {}},
      {provide: MatDialogRef, useValue: {close: () => {}, updatePosition: () => {}}},
    ]
  });

  beforeEach(async () => {
    formPropertyFactory = CommonTestingModule.formPropertyFactory;
    formService = TestBed.inject<FormService>(FormService);
    extensionsService = TestBed.inject<ExtensionsService>(ExtensionsService);
    cardinalityService = TestBed.inject(ExtensionCardinalityService);
    fhirService = TestBed.inject(FhirService);
    resolveCardinalitySpy = spyOn(cardinalityService, 'resolveCardinality')
      .and.returnValue(of({status: 'unknown'}));
    extSchema = formService.getFormLevelSchema();
    await createDialog(inputExt);
  });

  /**
   * Create an extension dialog fixture for a supplied extension array.
   * @param extensions - Extensions used to populate the parent array property.
   * @param rowIndex - Existing row to edit, or a negative value for a new row.
   */
  async function createDialog(
    extensions: fhir.Extension[],
    rowIndex = 0,
    extensionEditorScope: 'form' | 'item' = 'form'
  ) {
    const rootProperty = formPropertyFactory.createProperty(extSchema) as ArrayProperty;
    arrayProperty = formPropertyFactory.createProperty(extSchema.properties.extension, rootProperty, 'extension') as ArrayProperty;
    arrayProperty.setValue(extensions.map((ext) => extensionsService.updateExtension(ext)), false);
    data = {
      arrayProperty,
      rowIndex,
      extensionEditorScope
    } as DialogData;
    fixture = TestBed.createComponent(ExtensionDlgComponent);
    component = fixture.componentInstance;
    component.data = data;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /**
   * Find the date inputs rendered by a date-range widget.
   * @param dateRange - Date-range widget element to inspect.
   * @returns Input elements contained in the widget.
   */
  function getDateRangeInputs(dateRange: HTMLElement): NodeListOf<HTMLInputElement> {
    return dateRange.querySelectorAll('input.form-control');
  }

  /**
   * Read normalized label text from a date-range widget.
   * @param dateRange - Date-range widget element to inspect.
   * @returns Non-empty normalized label strings.
   */
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

  it('should not apply duplicate URL styling to unrelated schema errors', async () => {
    await createDialog([], -1);

    expect(fixture.nativeElement.querySelectorAll('lfb-string input.invalid').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('lfb-string .duplicate-extension-url-error-icon').length).toBe(0);
  });

  it('should display the warning icon for a URL pattern error', async () => {
    await createDialog([], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = 'http://example.org/invalid url';
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const urlWidget: HTMLElement = urlInput.closest('lfb-extension-url');
    expect(urlWidget.querySelector('.extension-url-error-icon')).not.toBeNull();
    expect(urlWidget.querySelector('.duplicate-extension-url-error-icon')).toBeNull();
    expect(urlWidget.textContent).toContain('Spaces and other whitespace characters are not allowed');
  });

  it('should reject every extension registered in the central managed URL set', async () => {
    await createDialog([], -1);

    for (const url of extensionsService.extensionsEditedInWidgets) {
      component.onChange({url, valueString: 'managed value'});

      expect(component.managedUrlError()).withContext(url).not.toBeNull();
      expect(component.disableSave()).withContext(url).toBeTrue();
    }
    expect(resolveCardinalitySpy).not.toHaveBeenCalled();
  });

  it('should reject questionnaire-hidden when it is registered in the central managed URL set', async () => {
    const hiddenUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-hidden';
    extensionsService.extensionsEditedInWidgets.add(hiddenUrl);
    await createDialog([], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = `  ${hiddenUrl}  `;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const urlWidget: HTMLElement = urlInput.closest('lfb-extension-url');
    expect(component.managedUrlError()).toBe(
      'This extension cannot be added here. Use the dedicated “Hide this item from users?” field on a questionnaire item instead.'
    );
    expect(component.disableSave()).toBeTrue();
    expect(resolveCardinalitySpy).not.toHaveBeenCalled();
    expect(urlInput.classList).toContain('invalid');
    expect(urlInput.getAttribute('aria-invalid')).toBe('true');
    expect(urlWidget.querySelector('.managed-extension-url-error-icon')).not.toBeNull();
    expect(urlWidget.textContent).toContain('Use the dedicated “Hide this item from users?” field');
  });

  it('should use the item-level field label for a managed variable extension', async () => {
    await createDialog([], -1, 'item');
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = EXTENSION_URL_VARIABLE;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.managedUrlError()).toBe(
      'This extension cannot be added here. Use the dedicated “Item variables” field instead.'
    );
    expect(urlInput.getAttribute('aria-invalid')).toBe('true');
  });

  it('should show how to reach the Variable Type field for custom variable metadata', async () => {
    await createDialog([], -1, 'item');
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = EXTENSION_URL_CUSTOM_VARIABLE_TYPE;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.managedUrlError()).toBe(
      'This extension cannot be added here. Use the dedicated “Variable Type” field in the '
      + '“Create/edit variables” dialog opened from the “Item variables” section instead.'
    );
    expect(urlInput.getAttribute('aria-invalid')).toBe('true');
  });

  it('should reject changing an editable extension URL to an existing managed URL', async () => {
    await createDialog(inputExt, 0);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = EXTENSION_URL_ENTRY_FORMAT;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.managedUrlError()).not.toBeNull();
    expect(component.disableSave()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Use the dedicated “Entry format” field');

    urlInput.value = 'http://example.org/unmanaged';
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.managedUrlError()).toBeNull();
    expect(component.disableSave()).toBeFalse();
  });

  it('should allow a duplicate unknown extension URL without warning when definition metadata is unavailable', async () => {
    await createDialog(inputExt, -1);

    component.onChange({url: inputExt[0].url, valueString: 'another value'});

    expect(resolveCardinalitySpy).toHaveBeenCalledOnceWith(inputExt[0].url);
    expect(component.duplicateUrlError()).toBeNull();
    expect(fixture.nativeElement.querySelector('.alert-warning')).toBeNull();
  });

  it('should reject an unknown duplicate resolved as a singleton by the FHIR server', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-singleton';
    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '1'}));
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = extensionUrl;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(resolveCardinalitySpy).toHaveBeenCalledOnceWith(extensionUrl);
    expect(component.duplicateUrlError()?.url).toBe(extensionUrl);
    expect(component.disableSave()).toBeTrue();
    expect(urlInput.classList).toContain('invalid');
  });

  it('should allow an unknown duplicate resolved as repeatable by the FHIR server', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-repeatable';
    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '*'}));
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = extensionUrl;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(resolveCardinalitySpy).toHaveBeenCalledOnceWith(extensionUrl);
    expect(component.duplicateUrlError()).toBeNull();
    expect(component.disableSave()).toBeFalse();
    expect(urlInput.classList).not.toContain('invalid');
  });

  it('should ask the user to select among definitions with conflicting maxima', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/conflicting-extension';
    const candidates: ExtensionCardinalityCandidate[] = [{
      version: '1.0.0',
      fhirVersion: '4.0.1',
      maxCardinality: '1'
    }, {
      version: '2.0.0',
      fhirVersion: '5.0.0',
      maxCardinality: '*'
    }];
    const closed = new Subject<ExtensionCardinalityCandidate | null>();
    const dismissed = new Subject<void>();
    const modalRef = {
      componentInstance: {},
      closed,
      dismissed
    } as any;
    resolveCardinalitySpy.and.returnValue(of({
      status: 'ambiguous',
      candidates
    }));
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const modalOpenSpy = spyOn(component.ngbModalService, 'open').and.returnValue(modalRef);
    const rememberSelectionSpy = spyOn(cardinalityService, 'rememberSelection');
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = extensionUrl;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(modalOpenSpy).toHaveBeenCalled();
    expect(component.checkingExtensionCardinality()).toBeTrue();
    expect(component.disableSave()).toBeTrue();
    expect(modalRef.componentInstance.candidates).toBe(candidates);

    closed.next(candidates[0]);
    fixture.detectChanges();

    expect(rememberSelectionSpy).toHaveBeenCalledOnceWith(
      extensionUrl,
      candidates[0],
      cardinalityService.getSelectionGeneration(),
      cardinalityService.getCurrentServerEndpoint()
    );
    expect(component.checkingExtensionCardinality()).toBeFalse();
    expect(component.duplicateUrlError()?.message).toContain('does not allow multiple');
    expect(component.disableSave()).toBeTrue();
  });

  it('should wait for another editor selecting the same definition', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/shared-selection';
    const candidates: ExtensionCardinalityCandidate[] = [{
      version: '1.0.0',
      maxCardinality: '1'
    }, {
      version: '2.0.0',
      maxCardinality: '*'
    }];
    const selectionChange = new Subject<void>();
    resolveCardinalitySpy.and.returnValue(of({status: 'ambiguous', candidates}));
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const tryBeginSelectionSpy = spyOn(cardinalityService, 'tryBeginSelection').and.returnValue(false);
    spyOn(cardinalityService, 'waitForSelection').and.returnValue(selectionChange);
    const modalOpenSpy = spyOn(component.ngbModalService, 'open');

    component.onChange({url: extensionUrl, valueString: 'second value'});

    expect(tryBeginSelectionSpy).toHaveBeenCalledOnceWith(
      extensionUrl,
      cardinalityService.getSelectionGeneration(),
      cardinalityService.getCurrentServerEndpoint()
    );
    expect(modalOpenSpy).not.toHaveBeenCalled();
    expect(component.checkingExtensionCardinality()).toBeTrue();

    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '1'}));
    selectionChange.next();
    fixture.detectChanges();

    expect(component.duplicateUrlError()?.message).toContain('does not allow multiple');
    expect(component.disableSave()).toBeTrue();
  });

  it('should close obsolete extension and selection dialogs when the Questionnaire changes', () => {
    const dismissSpy = jasmine.createSpy('dismiss');
    const closeSpy = spyOn(component['matDialogRef'], 'close');
    component.cardinalitySelectionModalRef = {dismiss: dismissSpy} as any;
    component.activeCardinalitySelection = {
      url: 'http://example.org/StructureDefinition/obsolete-extension',
      selectionGeneration: cardinalityService.getSelectionGeneration(),
      serverEndpoint: cardinalityService.getCurrentServerEndpoint()
    };

    cardinalityService.clearSelections();

    expect(dismissSpy).toHaveBeenCalledOnceWith();
    expect(closeSpy).toHaveBeenCalledOnceWith(false);
    expect(component.cardinalitySelectionModalRef).toBeUndefined();
    expect(component.activeCardinalitySelection).toBeUndefined();
  });

  it('should remain permissive with a warning when definition selection is skipped', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/conflicting-extension';
    const candidates: ExtensionCardinalityCandidate[] = [{
      version: '1.0.0',
      maxCardinality: '1'
    }, {
      version: '2.0.0',
      maxCardinality: '*'
    }];
    const closed = new Subject<ExtensionCardinalityCandidate | null>();
    const modalRef = {
      componentInstance: {},
      closed,
      dismissed: new Subject<void>()
    } as any;
    resolveCardinalitySpy.and.returnValue(of({
      status: 'ambiguous',
      candidates
    }));
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    spyOn(component.ngbModalService, 'open').and.returnValue(modalRef);
    const rememberUnverifiedSpy = spyOn(cardinalityService, 'rememberUnverified');
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = extensionUrl;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    closed.next(null);
    fixture.detectChanges();

    expect(rememberUnverifiedSpy).toHaveBeenCalledOnceWith(
      extensionUrl,
      cardinalityService.getSelectionGeneration(),
      cardinalityService.getCurrentServerEndpoint()
    );
    expect(component.duplicateUrlError()).toBeNull();
    expect(component.disableSave()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.alert-warning')?.textContent)
      .toContain('Cardinality was not verified');

    resolveCardinalitySpy.and.returnValue(of({status: 'unverified'}));
    component.onChange({url: extensionUrl, valueString: 'second value'});
    fixture.detectChanges();

    expect(component.disableSave()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.alert-warning')?.textContent)
      .toContain('Cardinality was not verified');

    component.onChange({url: 'http://example.org/StructureDefinition/different-extension'});
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alert-warning')).toBeNull();

    component.onChange({url: extensionUrl, valueString: 'second value'});
    fixture.detectChanges();

    expect(component.disableSave()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.alert-warning')?.textContent)
      .toContain('Cardinality was not verified');
  });

  it('should warn when the selected definition has an unknown maximum', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/unknown-maximum-extension';
    const candidates: ExtensionCardinalityCandidate[] = [{
      version: '1.0.0',
      maxCardinality: '1'
    }, {
      version: '2.0.0',
      maxCardinality: 'unknown'
    }];
    const closed = new Subject<ExtensionCardinalityCandidate | null>();
    const modalRef = {
      componentInstance: {},
      closed,
      dismissed: new Subject<void>()
    } as any;
    resolveCardinalitySpy.and.returnValue(of({status: 'ambiguous', candidates}));
    fixture.destroy();
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    spyOn(component.ngbModalService, 'open').and.returnValue(modalRef);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = extensionUrl;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    closed.next(candidates[1]);
    fixture.detectChanges();

    expect(component.duplicateUrlError()).toBeNull();
    expect(component.disableSave()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.alert-warning')?.textContent)
      .toContain('Cardinality was not verified');
  });

  it('should reopen definition selection when its dialog is unexpectedly dismissed', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/conflicting-extension';
    const candidates: ExtensionCardinalityCandidate[] = [{
      version: '1.0.0',
      maxCardinality: '1'
    }, {
      version: '2.0.0',
      maxCardinality: '*'
    }];
    const firstDismissed = new Subject<void>();
    const firstModalRef = {
      componentInstance: {},
      closed: new Subject<ExtensionCardinalityCandidate | null>(),
      dismissed: firstDismissed
    } as any;
    const replacementModalRef = {
      componentInstance: {},
      closed: new Subject<ExtensionCardinalityCandidate | null>(),
      dismissed: new Subject<void>(),
      dismiss: jasmine.createSpy('dismiss')
    } as any;
    resolveCardinalitySpy.and.returnValue(of({status: 'ambiguous', candidates}));
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const modalOpenSpy = spyOn(component.ngbModalService, 'open')
      .and.returnValues(firstModalRef, replacementModalRef);
    const rememberUnverifiedSpy = spyOn(cardinalityService, 'rememberUnverified');

    component.onChange({url: extensionUrl, valueString: 'second value'});
    firstDismissed.next();
    fixture.detectChanges();

    expect(modalOpenSpy).toHaveBeenCalledTimes(2);
    expect(modalOpenSpy).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({backdrop: 'static', keyboard: false})
    );
    expect(rememberUnverifiedSpy).not.toHaveBeenCalled();
    expect(component.cardinalitySelectionModalRef).toBe(replacementModalRef);
    expect(component.checkingExtensionCardinality()).toBeTrue();
    expect(component.disableSave()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.alert-warning')).toBeNull();
  });

  it('should replace an open definition selector when the extension URL changes', async () => {
    const duplicateUrlA = 'http://example.org/StructureDefinition/conflicting-extension-a';
    const duplicateUrlB = 'http://example.org/StructureDefinition/conflicting-extension-b';
    const candidates: ExtensionCardinalityCandidate[] = [{
      version: '1.0.0',
      maxCardinality: '1'
    }, {
      version: '2.0.0',
      maxCardinality: '*'
    }];
    const firstModalRef = {
      componentInstance: {},
      closed: new Subject<ExtensionCardinalityCandidate | null>(),
      dismissed: new Subject<void>(),
      dismiss: jasmine.createSpy('dismiss first selector')
    } as any;
    const replacementModalRef = {
      componentInstance: {},
      closed: new Subject<ExtensionCardinalityCandidate | null>(),
      dismissed: new Subject<void>(),
      dismiss: jasmine.createSpy('dismiss replacement selector')
    } as any;
    resolveCardinalitySpy.and.returnValue(of({status: 'ambiguous', candidates}));
    await createDialog([
      {url: duplicateUrlA, valueString: 'first A value'},
      {url: duplicateUrlB, valueString: 'first B value'}
    ], -1);
    const modalOpenSpy = spyOn(component.ngbModalService, 'open')
      .and.returnValues(firstModalRef, replacementModalRef);

    component.onChange({url: duplicateUrlA, valueString: 'second A value'});
    component.onChange({url: duplicateUrlB, valueString: 'second B value'});

    expect(firstModalRef.dismiss).toHaveBeenCalledOnceWith();
    expect(modalOpenSpy).toHaveBeenCalledTimes(2);
    expect(component.cardinalitySelectionModalRef).toBe(replacementModalRef);
    expect(component.activeCardinalitySelection?.url).toBe(duplicateUrlB);
    expect(component.checkingExtensionCardinality()).toBeTrue();
    expect(component.disableSave()).toBeTrue();
  });

  it('should allow a second occurrence when the resolved maximum is two', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-max-two';
    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '2'}));
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = extensionUrl;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.duplicateUrlError()).toBeNull();
    expect(component.disableSave()).toBeFalse();
    expect(urlInput.classList).not.toContain('invalid');
  });

  it('should reject a third occurrence when the resolved maximum is two', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-max-two';
    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '2'}));
    await createDialog([
      {url: extensionUrl, valueString: 'first value'},
      {url: extensionUrl, valueString: 'second value'}
    ], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = extensionUrl;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.duplicateUrlError()?.message).toContain('at most 2 occurrences');
    expect(component.disableSave()).toBeTrue();
    expect(urlInput.classList).toContain('invalid');
  });

  it('should exclude the current row when enforcing a resolved finite maximum', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-max-two';
    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '2'}));
    await createDialog([
      {url: extensionUrl, valueString: 'first value'},
      {url: extensionUrl, valueString: 'second value'}
    ], 1);
    const valueInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="valueString"]');

    valueInput.value = 'changed value';
    valueInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.duplicateUrlError()).toBeNull();
    expect(component.disableSave()).toBeFalse();
  });

  it('should disable Save and announce status while cardinality lookup is pending', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/pending-extension';
    const cardinalityResult = new Subject<ExtensionCardinalityResolution>();
    resolveCardinalitySpy.and.returnValue(cardinalityResult);
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = extensionUrl;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.checkingExtensionCardinality()).toBeTrue();
    expect(component.disableSave()).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent)
      .toContain('Checking extension cardinality');

    cardinalityResult.next({status: 'unknown'});
    fixture.detectChanges();

    expect(component.checkingExtensionCardinality()).toBeFalse();
    expect(component.disableSave()).toBeFalse();
    expect(urlInput.hasAttribute('aria-invalid')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.alert-warning')).toBeNull();
  });

  it('should discard a lookup result from a previously selected FHIR server', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-switch-extension';
    const oldServerResult = new Subject<ExtensionCardinalityResolution>();
    resolveCardinalitySpy.and.returnValue(oldServerResult);
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const endpointSpy = spyOn(cardinalityService, 'getCurrentServerEndpoint')
      .and.returnValue('https://old.example.org/fhir');

    component.onChange({url: extensionUrl, valueString: 'second value'});
    endpointSpy.and.returnValue('https://new.example.org/fhir');
    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '*'}));
    oldServerResult.next({status: 'resolved', maxCardinality: '1'});

    expect(resolveCardinalitySpy).toHaveBeenCalledTimes(2);
    expect(component.duplicateUrlError()).toBeNull();
    expect(component.checkingExtensionCardinality()).toBeFalse();
    expect(component['isSaveAllowed']()).toBeTrue();
  });

  it('should revalidate a settled singleton result when the FHIR server changes', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-change-settled-extension';
    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '1'}));
    fixture.destroy();
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);

    component.onChange({url: extensionUrl, valueString: 'second value'});

    expect(component.duplicateUrlError()).not.toBeNull();
    expect(component['isSaveAllowed']()).toBeFalse();

    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '*'}));
    fhirService.setFhirServer({
      endpoint: 'https://new.example.org/fhir',
      version: 'R4'
    });

    expect(resolveCardinalitySpy).toHaveBeenCalledTimes(2);
    expect(component.duplicateUrlError()).toBeNull();
    expect(component.checkingExtensionCardinality()).toBeFalse();
    expect(component['isSaveAllowed']()).toBeTrue();
  });

  it('should discard a definition selected after the FHIR server changes', async () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-switch-selection';
    const candidates: ExtensionCardinalityCandidate[] = [{
      version: '1.0.0',
      maxCardinality: '1'
    }, {
      version: '2.0.0',
      maxCardinality: '*'
    }];
    const closed = new Subject<ExtensionCardinalityCandidate | null>();
    const modalRef = {
      componentInstance: {},
      closed,
      dismissed: new Subject<void>()
    } as any;
    resolveCardinalitySpy.and.returnValue(of({status: 'ambiguous', candidates}));
    await createDialog([{url: extensionUrl, valueString: 'first value'}], -1);
    const endpointSpy = spyOn(cardinalityService, 'getCurrentServerEndpoint')
      .and.returnValue('https://old.example.org/fhir');
    spyOn(component.ngbModalService, 'open').and.returnValue(modalRef);
    const rememberSelectionSpy = spyOn(cardinalityService, 'rememberSelection');

    component.onChange({url: extensionUrl, valueString: 'second value'});
    endpointSpy.and.returnValue('https://new.example.org/fhir');
    resolveCardinalitySpy.and.returnValue(of({status: 'resolved', maxCardinality: '*'}));
    closed.next(candidates[0]);

    expect(rememberSelectionSpy).not.toHaveBeenCalled();
    expect(resolveCardinalitySpy).toHaveBeenCalledTimes(2);
    expect(component.duplicateUrlError()).toBeNull();
    expect(component.checkingExtensionCardinality()).toBeFalse();
    expect(component['isSaveAllowed']()).toBeTrue();
  });

  it('should display a duplicate error with an icon and invalid styling under the URL field', async () => {
    await createDialog([{url: EXTENSION_URL_RENDERING_STYLE, valueString: 'first'}], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');

    urlInput.value = EXTENSION_URL_RENDERING_STYLE;
    urlInput.dispatchEvent(new InputEvent('input'));
    urlInput.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();

    const urlWidget = urlInput.closest('lfb-extension-url');
    const duplicateErrorId = urlInput.getAttribute('aria-describedby');
    expect(urlInput.classList).toContain('invalid');
    expect(urlInput.getAttribute('aria-invalid')).toBe('true');
    expect(duplicateErrorId).toBe(`duplicate-extension-url-error-${urlInput.id}`);
    expect(urlWidget?.querySelector(`[id="${duplicateErrorId}"]`)).not.toBeNull();
    expect(urlWidget?.querySelector('fa-icon')).not.toBeNull();
    expect(urlWidget?.textContent).toContain('already exists');
    expect(fixture.nativeElement.querySelector('lfb-extension-dlg > p.text-danger')).toBeNull();

    urlInput.value = 'http://unique.extension.org';
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(urlInput.classList).not.toContain('invalid');
    expect(urlInput.hasAttribute('aria-invalid')).toBeFalse();
    expect(urlWidget?.textContent).not.toContain('already exists');
  });

  it('should retain the duplicate error when changing directly between duplicate URLs', async () => {
    const duplicateUrlA = EXTENSION_URL_RENDERING_STYLE;
    const duplicateUrlB = EXTENSION_URL_RENDERING_XHTML;
    await createDialog([
      {url: duplicateUrlA, valueString: 'first value'},
      {url: duplicateUrlB, valueString: 'second value'}
    ], -1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');
    const urlWidget = urlInput.closest('lfb-extension-url');

    urlInput.value = duplicateUrlA;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(urlInput.classList).toContain('invalid');
    expect(urlWidget?.textContent).toContain('already exists');

    urlInput.value = duplicateUrlB;
    urlInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const duplicateErrorId = urlInput.getAttribute('aria-describedby');
    expect(component.duplicateUrlError()?.url).toBe(duplicateUrlB);
    expect(component.disableSave()).toBeTrue();
    expect(urlInput.classList).toContain('invalid');
    expect(urlInput.getAttribute('aria-invalid')).toBe('true');
    expect(duplicateErrorId).toBe(`duplicate-extension-url-error-${urlInput.id}`);
    expect(urlWidget?.querySelector(`[id="${duplicateErrorId}"]`)).not.toBeNull();
    expect(urlWidget?.querySelector('fa-icon')).not.toBeNull();
    expect(urlWidget?.querySelector('[role="alert"]')).not.toBeNull();
    expect(urlWidget?.textContent).toContain('already exists');
  });

  it('should display a duplicate error when only the value of an imported duplicate is edited', async () => {
    await createDialog([
      {url: EXTENSION_URL_RENDERING_STYLE, valueString: 'first value'},
      {url: EXTENSION_URL_RENDERING_STYLE, valueString: 'second value'}
    ], 1);
    const urlInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="url"]');
    const valueInput: HTMLInputElement = fixture.nativeElement.querySelector('input[id^="valueString"]');

    expect(urlInput.classList).toContain('ng-pristine');
    valueInput.value = 'changed value';
    valueInput.dispatchEvent(new InputEvent('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const urlWidget = urlInput.closest('lfb-extension-url');
    const duplicateErrorId = urlInput.getAttribute('aria-describedby');
    expect(valueInput.classList).toContain('ng-dirty');
    expect(urlInput.classList).toContain('ng-pristine');
    expect(component.disableSave()).toBeTrue();
    expect(urlInput.classList).toContain('invalid');
    expect(urlInput.getAttribute('aria-invalid')).toBe('true');
    expect(duplicateErrorId).toBe(`duplicate-extension-url-error-${urlInput.id}`);
    expect(urlWidget?.querySelector(`[id="${duplicateErrorId}"]`)).not.toBeNull();
    expect(urlWidget?.querySelector('fa-icon')).not.toBeNull();
    expect(urlWidget?.querySelector('[role="alert"]')).not.toBeNull();
    expect(urlWidget?.textContent).toContain('already exists');
  });

  it('should allow multiple occurrences for a known repeatable extension', async () => {
    const variableUrl = 'http://hl7.org/fhir/StructureDefinition/variable';
    await createDialog([{url: variableUrl, valueExpression: {language: 'text/fhirpath', expression: '1'}}], -1);

    component.onChange({url: variableUrl, valueExpression: {language: 'text/fhirpath', expression: '2'}});

    expect(component.duplicateUrlError()).toBeNull();
  });

  it('should reject MIME type before checking whether multiple occurrences are allowed', async () => {
    await createDialog([{url: EXTENSION_URL_MIME_TYPE, valueCode: 'image/png'}], -1);

    component.onChange({url: EXTENSION_URL_MIME_TYPE, valueCode: 'application/pdf'});

    expect(component.duplicateUrlError()).toBeNull();
    expect(component.managedUrlError()).toContain(
      'Use the dedicated “Restrictions” field on a questionnaire item instead.'
    );
    expect(component.disableSave()).toBeTrue();
    expect(resolveCardinalitySpy).not.toHaveBeenCalled();
  });

  it('should reject duplicates for a known single-occurrence extension', async () => {
    await createDialog([{url: EXTENSION_URL_RENDERING_STYLE, valueString: 'bold'}], -1);

    component.onChange({url: EXTENSION_URL_RENDERING_STYLE, valueString: 'italic'});

    expect(component.duplicateUrlError()?.message).toContain('already exists');
    expect(component.disableSave()).toBeTrue();
  });

  it('should not treat the current extension as a duplicate when editing', async () => {
    const extension = {url: EXTENSION_URL_RENDERING_STYLE, valueString: 'bold'};
    await createDialog([extension], 0);

    component.onChange({...extension, valueString: 'changed value'});

    expect(component.duplicateUrlError()).toBeNull();
  });

  it('should reject changing an extension URL to another single-occurrence URL in the same scope', async () => {
    await createDialog([...inputExt, {url: EXTENSION_URL_RENDERING_STYLE, valueString: 'other value'}], 0);

    component.onChange({url: EXTENSION_URL_RENDERING_STYLE, valueString: 'changed value'});

    expect(component.duplicateUrlError()?.message).toContain('already exists');
    expect(component.disableSave()).toBeTrue();
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

  it('should save ContactDetail without telecom after deleting telecom row', async () => {
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
    const closeSpy = spyOn(component['matDialogRef'], 'close');

    const extensionObj = fixture.debugElement.query(By.directive(ExtensionObjComponent))
      .componentInstance as ExtensionObjComponent;
    const telecomProperty: any = extensionObj.sfFormRootProperty.getProperty('valueContactDetail/telecom');
    const telecomArray = fixture.debugElement.queryAll(By.directive(LfbArrayComponent))
      .find((el) => el.componentInstance.formProperty === telecomProperty)
      .componentInstance as LfbArrayComponent;

    telecomArray.removeItem(telecomProperty.properties[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    component.save();

    const savedExtension = closeSpy.calls.mostRecent().args[0] as fhir.Extension;
    expect(savedExtension.valueContactDetail.telecom).toBeUndefined();
    expect(savedExtension['__$stringify']).toBe(JSON.stringify({name: 'Support'}));
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
