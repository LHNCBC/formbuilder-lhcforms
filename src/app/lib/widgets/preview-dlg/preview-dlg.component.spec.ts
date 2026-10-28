import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ElementRef} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {PreviewData, PreviewDlgComponent, PreviewTab} from './preview-dlg.component';
import {FormService} from '../../../services/form.service';
import {FhirService} from '../../../services/fhir.service';
import {SubjectTypeService} from '../../../services/subject-type.service';
import {ContainedResourceService} from '../../../services/contained-resource.service';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';

declare const LForms: any;

describe('PreviewDlgComponent', () => {
  let component: PreviewDlgComponent;
  let fixture: ComponentFixture<PreviewDlgComponent>;
  let exportFHIR: jasmine.Spy;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let formService: any;
  let data: PreviewData;
  const response = {resourceType: 'QuestionnaireResponse', id: 'response-1', status: 'in-progress'};
  const bundle = {
    resourceType: 'Bundle', type: 'transaction', entry: [{
      resource: {resourceType: 'Observation', derivedFrom: [{reference: 'QuestionnaireResponse/response-1'}]},
      request: {method: 'POST', url: 'Observation'}
    }]
  };

  beforeEach(async () => {
    data = {questionnaire: {
      resourceType: 'Questionnaire', status: 'draft', item: [],
      contained: [{resourceType: 'Observation', id: 'obs-template', status: 'final', code: {text: 'Value'}} as any],
      extension: [{url: EXTENSION_URL_TEMPLATE_EXTRACT, extension: [
        {url: 'template', valueReference: {reference: '#obs-template'}}
      ]}]
    }};
    formService = {
      lformsVersion: '44.0.0',
      convertFromR5: jasmine.createSpy('convertFromR5').and.callFake(questionnaire => questionnaire),
      getQuantityComparatorCompatibilityError: jasmine.createSpy('comparatorError').and.returnValue(''),
      getStorageItem: jasmine.createSpy('getStorageItem').and.returnValue(null),
      setStorageItem: jasmine.createSpy('setStorageItem')
    };
    spyOn(LForms.Util, 'setFHIRContext');
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open', 'dismiss']);
    exportFHIR = spyOn(LForms.Util, 'getFormFHIRData').and.returnValue([response, bundle]);
    await TestBed.configureTestingModule({
      imports: [PreviewDlgComponent],
      providers: [
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: data},
        {provide: FormService, useValue: formService},
        {provide: FhirService, useValue: {
          getSmartClient: jasmine.createSpy('getSmartClient'),
          getLastUsedValidationServer: jasmine.createSpy('getLastUsedValidationServer')
        }},
        {provide: SubjectTypeService, useValue: {
          getSubjectTypeCompatibilityWarning: jasmine.createSpy('subjectWarning').and.returnValue('')
        }},
        {provide: ContainedResourceService, useValue: {
          getCompatibilityWarning: jasmine.createSpy('containedWarning').and.returnValue('')
        }},
        {provide: MatSnackBar, useValue: snackBar}
      ]
    })
    .overrideComponent(PreviewDlgComponent, {set: {template: ''}})
    .compileComponents();
    fixture = TestBed.createComponent(PreviewDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.extractionFormContainer = new ElementRef(document.createElement('div'));
    component.handleFormReady();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens on Rendered Form by default and remembers the selected tab by name', () => {
    expect(formService.getStorageItem).toHaveBeenCalledWith('sessionStorage', 'previewTab');
    expect(component.activeTopLevelTabIndex).toBe(PreviewTab.RenderedForm);
    component.onPreviewTabSelected(PreviewTab.QuestionnaireJSON);
    expect(formService.setStorageItem).toHaveBeenCalledWith('sessionStorage', 'previewTab', 'QuestionnaireJSON');
    formService.getStorageItem.and.returnValue('QuestionnaireJSON');
    component.ngOnInit();
    expect(component.activeTopLevelTabIndex).toBe(PreviewTab.QuestionnaireJSON);
    // Unknown and numeric values fall back to the default.
    for(const stored of ['Unknown', '0', 'toString']) {
      formService.getStorageItem.and.returnValue(stored);
      component.ngOnInit();
      expect(component.activeTopLevelTabIndex).toBe(PreviewTab.RenderedForm);
    }
  });

  it('reopens a remembered snapshot tab after the rendered form is ready', fakeAsync(() => {
    formService.getStorageItem.and.returnValue('ExtractedResources');
    component.formReady = false;
    component.ngOnInit();
    // The rendered form must be shown first so that the widget is created.
    expect(component.activeTopLevelTabIndex).toBe(PreviewTab.RenderedForm);
    component.handleFormReady();
    expect(component.activeTopLevelTabIndex).toBe(PreviewTab.ExtractedResources);
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(1);
    expect(JSON.parse(component.extractedResourcesJSON)).toEqual(bundle);
    // The remembered tab is used only once.
    component.onPreviewTabSelected(PreviewTab.RenderedForm);
    component.handleFormReady();
    expect(component.activeTopLevelTabIndex).toBe(PreviewTab.RenderedForm);
  }));

  it('shows a remembered snapshot tab with the error when the form fails to render', () => {
    formService.getStorageItem.and.returnValue('QuestionnaireResponse');
    component.formReady = false;
    component.ngOnInit();
    component.handleLFormsError({detail: 'Unable to render'});
    expect(component.activeTopLevelTabIndex).toBe(PreviewTab.QuestionnaireResponse);
    expect(component.responseError).toContain('Unable to render');
    expect(exportFHIR).not.toHaveBeenCalled();
  });

  it('keeps a tab chosen before the form is ready instead of the remembered one', () => {
    formService.getStorageItem.and.returnValue('ExtractedResources');
    component.formReady = false;
    component.ngOnInit();
    component.onPreviewTabSelected(PreviewTab.QuestionnaireJSON);
    component.handleFormReady();
    expect(component.activeTopLevelTabIndex).toBe(PreviewTab.QuestionnaireJSON);
  });

  it('omits the empty message only when the tab explains the missing JSON', () => {
    expect(component.hasEmptySnapshotCause('qr')).toBeFalse();
    expect(component.hasEmptySnapshotCause('er')).toBeFalse();
    component.responseError = 'Failed';
    expect(component.hasEmptySnapshotCause('qr')).toBeTrue();
    component.extractionError = 'Failed';
    expect(component.hasEmptySnapshotCause('er')).toBeTrue();
    component.extractionError = '';
    component.extractionUnavailable = 'Requires a newer LForms';
    expect(component.hasEmptySnapshotCause('er')).toBeTrue();
    component.extractionUnavailable = '';
    component.hasTemplateExtraction = false;
    expect(component.hasEmptySnapshotCause('er')).toBeTrue();
    component.hasObservationExtraction = true;
    expect(component.hasEmptySnapshotCause('er')).toBeFalse();
    component.noResourcesExtracted = true;
    expect(component.hasEmptySnapshotCause('er')).toBeTrue();
  });

  it('finds relationship items without an extracted ancestor, as LHC-Forms extracts them', () => {
    const url = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract';
    delete data.questionnaire.extension;
    data.questionnaire.item = [
      {linkId: 'top', type: 'decimal', extension: [{url, valueCode: 'member'}]},
      {linkId: 'coded', type: 'decimal', extension: [{url, valueCode: 'independent'}],
        code: [{code: 'C1', extension: [{url, valueBoolean: true}]}]},
      {linkId: 'panel', type: 'group', extension: [{url, valueBoolean: true}], item: [
        {linkId: 'member', type: 'decimal', extension: [{url, valueCode: 'member'}], item: [
          {linkId: 'nested', type: 'decimal', extension: [{url, valueCode: 'component'}]}
        ]},
        {linkId: 'off', type: 'group', extension: [{url, valueBoolean: false}], item: [
          {linkId: 'under-off', type: 'decimal', extension: [{url, valueCode: 'member'}]}
        ]}
      ]}
    ];
    component.ngOnInit();
    expect(component.unextractedRelationshipLinkIds).toEqual(['top', 'under-off']);
    // A questionnaire-level setting applies to all items.
    data.questionnaire.extension = [{url, valueBoolean: true}];
    component.ngOnInit();
    expect(component.unextractedRelationshipLinkIds).toEqual(['under-off']);
  });

  it('reports when requested extraction produces no resources', fakeAsync(() => {
    exportFHIR.and.returnValue([response]);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(component.noResourcesExtracted).toBeTrue();
    exportFHIR.and.returnValue([response, bundle]);
    component.onPreviewTabSelected(PreviewTab.RenderedForm);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(component.noResourcesExtracted).toBeFalse();
    // Without extraction settings, nothing is requested, so there is nothing to report.
    delete data.questionnaire.extension;
    component.ngOnInit();
    exportFHIR.and.returnValue(response);
    component.onPreviewTabSelected(PreviewTab.RenderedForm);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(component.noResourcesExtracted).toBeFalse();
  }));

  it('downloads the questionnaire JSON of the selected version', async () => {
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:questionnaire');
    const dispatch = spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').and.returnValue(true);
    data.questionnaire.title = 'My form';
    component.onJsonVersionSelected(2);
    component.downloadQuestionnaireJSON();
    const blob = createUrl.calls.mostRecent().args[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual(data.questionnaire);
    const anchor = dispatch.calls.mostRecent().object as HTMLAnchorElement;
    expect(anchor.download).toBe('My-form.STU3.json');
    data.questionnaire.name = 'short name';
    component.downloadQuestionnaireJSON();
    expect((dispatch.calls.mostRecent().object as HTMLAnchorElement).download).toBe('short-name.STU3.json');
  });

  it('generates both snapshots in one R5 call using the widget container', fakeAsync(() => {
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    expect(component.extractionInProgress).toBeTrue();
    tick();
    expect(exportFHIR).toHaveBeenCalledOnceWith(
      'QuestionnaireResponse', 'R5', component.extractionFormContainer.nativeElement, {extract: true}
    );
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(JSON.parse(component.extractedResourcesJSON)).toEqual(bundle);
    expect(component.extractionJSON).toBe(component.extractedResourcesJSON);
    expect(component.extractionViewLabel).toBe('extracted resources');
    component.onPreviewTabSelected(PreviewTab.QuestionnaireResponse);
    tick();
    expect(component.extractionJSON).toBe(component.questionnaireResponseJSON);
    expect(component.extractionViewLabel).toBe('QuestionnaireResponse');
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(component.extractionJSON).toBe(component.extractedResourcesJSON);
    expect(exportFHIR).toHaveBeenCalledTimes(1);
    expect(component.extractionInProgress).toBeFalse();
  }));

  it('generates the paired snapshots when Questionnaire Response is opened first', fakeAsync(() => {
    component.onPreviewTabSelected(PreviewTab.QuestionnaireResponse);
    tick();
    expect(JSON.parse(component.extractionJSON)).toEqual(response);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(JSON.parse(component.extractionJSON)).toEqual(bundle);
    expect(exportFHIR).toHaveBeenCalledTimes(1);
  }));

  it('waits for form readiness and regenerates only on refresh or reentry', fakeAsync(() => {
    component.formReady = false;
    component.onPreviewTabSelected(PreviewTab.QuestionnaireResponse);
    tick();
    expect(exportFHIR).not.toHaveBeenCalled();
    expect(component.snapshotsSettled).toBeFalse();
    component.handleFormReady();
    expect(component.snapshotsSettled).toBeFalse();
    tick();
    expect(component.snapshotsSettled).toBeTrue();
    expect(exportFHIR).toHaveBeenCalledTimes(1);
    component.refreshExtraction();
    component.refreshExtraction();
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(2);
    component.onPreviewTabSelected(PreviewTab.RenderedForm);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(3);
  }));

  it('does not extract on the Questionnaire JSON tab but refreshes when returning to snapshots', fakeAsync(() => {
    component.onPreviewTabSelected(PreviewTab.QuestionnaireResponse);
    tick();
    component.onPreviewTabSelected(PreviewTab.QuestionnaireJSON);
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(1);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(2);
  }));

  it('does not use the Questionnaire JSON version selector for extraction', fakeAsync(() => {
    component.onJsonVersionSelected(2);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(exportFHIR.calls.mostRecent().args[1]).toBe('R5');
  }));

  it('never falls back to another form when the preview container is missing', fakeAsync(() => {
    component.extractionFormContainer = undefined;
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(exportFHIR).not.toHaveBeenCalled();
    expect(component.extractionError).toContain('unavailable');
    expect(component.responseError).toContain('unavailable');
    expect(component.questionnaireResponseJSON).toBe('');
  }));

  it('detects templates only when they reference an existing contained resource', () => {
    expect(component.hasTemplateExtraction).toBeTrue();
    data.questionnaire.contained = [];
    component.ngOnInit();
    expect(component.hasTemplateExtraction).toBeFalse();
    delete data.questionnaire.extension;
    data.questionnaire.contained = [{resourceType: 'Bundle', id: 'bundle-template', type: 'transaction'} as any];
    data.questionnaire.item = [{linkId: 'group', type: 'group', item: [{
      linkId: 'value', type: 'decimal',
      extension: [{url: `${EXTENSION_URL_TEMPLATE_EXTRACT}Bundle`, valueReference: {reference: '#bundle-template'}}]
    }]}];
    component.ngOnInit();
    expect(component.hasTemplateExtraction).toBeTrue();
  });

  it('requests only the response when no extraction is configured', fakeAsync(() => {
    delete data.questionnaire.extension;
    component.ngOnInit();
    exportFHIR.and.returnValue(response);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(exportFHIR).toHaveBeenCalledOnceWith(
      'QuestionnaireResponse', 'R5', component.extractionFormContainer.nativeElement
    );
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(component.extractedResourcesJSON).toBe('');
    expect(component.extractionUnavailable).toBe('');
    expect(component.extractionError).toBe('');
  }));

  it('extracts observation-based resources without templates', fakeAsync(() => {
    delete data.questionnaire.extension;
    data.questionnaire.item = [{linkId: 'weight', type: 'decimal', code: [{
      system: 'http://loinc.org', code: '29463-7',
      extension: [{url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract', valueBoolean: true}]
    }]}];
    component.ngOnInit();
    expect(component.hasTemplateExtraction).toBeFalse();
    expect(component.hasObservationExtraction).toBeTrue();
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(exportFHIR.calls.mostRecent().args[3]).toEqual({extract: true});
    expect(JSON.parse(component.extractedResourcesJSON)).toEqual(bundle);
  }));

  it('keeps the response available when no resources are extracted', fakeAsync(() => {
    exportFHIR.and.returnValue([response]);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(component.extractedResourcesJSON).toBe('');
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(component.extractionError).toBe('');
    expect(component.responseError).toBe('');
  }));

  it('preserves standalone observations and a template Bundle from older engines', fakeAsync(() => {
    formService.lformsVersion = '38.7.0';
    const observation = {resourceType: 'Observation', status: 'final'};
    exportFHIR.and.returnValue([response, observation, bundle]);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(JSON.parse(component.extractedResourcesJSON)).toEqual([observation, bundle]);
  }));

  it('warns about an unsupported engine while allowing response inspection', fakeAsync(() => {
    formService.lformsVersion = '34.3.0';
    exportFHIR.and.returnValue(response);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(component.extractionUnavailable).toContain('38.7.0 or later');
    expect(component.extractionUnavailable).toContain('34.3.0');
    expect(exportFHIR.calls.mostRecent().args.length).toBe(3);
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(component.extractedResourcesJSON).toBe('');
  }));

  it('clears stale output after failure and exports the response separately', fakeAsync(() => {
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    exportFHIR.and.callFake((_resource, _version, _container, options) => {
      if(options?.extract) {
        throw new Error('Invalid template expression');
      }
      return response;
    });
    component.refreshExtraction();
    expect(component.extractedResourcesJSON).toBe('');
    expect(component.questionnaireResponseJSON).toBe('');
    tick();
    expect(component.extractionError).toBe('Invalid template expression');
    expect(component.responseError).toBe('');
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(component.extractedResourcesJSON).toBe('');
    exportFHIR.and.returnValue([response, bundle]);
    component.refreshExtraction();
    tick();
    expect(component.extractionError).toBe('');
    expect(JSON.parse(component.extractedResourcesJSON)).toEqual(bundle);
  }));

  it('reports response export failures on the response tab only', fakeAsync(() => {
    exportFHIR.and.returnValue(null);
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    expect(component.extractionError).toContain('did not return a QuestionnaireResponse');
    expect(component.extractionError).not.toContain('Response export');
    expect(component.responseError).toContain('did not return a QuestionnaireResponse');
    expect(component.questionnaireResponseJSON).toBe('');
    expect(component.extractionInProgress).toBeFalse();
  }));

  it('cancels a pending extraction when the widget reports an error', fakeAsync(() => {
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    component.handleLFormsError({detail: 'Unable to render'});
    tick();
    expect(exportFHIR).not.toHaveBeenCalled();
    expect(component.formReady).toBeFalse();
    expect(component.extractionInProgress).toBeFalse();
    expect(component.extractionError).toContain('Unable to render');
    expect(component.responseError).toContain('Unable to render');
    expect(component.snapshotsSettled).toBeTrue();
  }));

  it('downloads the selected JSON and releases object URLs', async () => {
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:preview');
    const revokeUrl = spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').and.returnValue(true);
    component.questionnaireResponseJSON = JSON.stringify(response);
    component.activeTopLevelTabIndex = PreviewTab.QuestionnaireResponse;
    component.downloadExtractionJSON();
    const blob = createUrl.calls.mostRecent().args[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual(response);
    component.downloadExtractionJSON();
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview');
    component.ngOnDestroy();
    expect(revokeUrl).toHaveBeenCalledTimes(2);
  });

  it('reports clipboard failures in a pop-up message', () => {
    component.onExtractionCopied(false);
    expect(snackBar.open).toHaveBeenCalledOnceWith('Copy failed. Try Download JSON instead.', undefined, {duration: 3000});
  });

  it('reports download failures in a pop-up message', () => {
    spyOn(URL, 'createObjectURL').and.throwError('Blocked');
    component.questionnaireResponseJSON = JSON.stringify(response);
    component.activeTopLevelTabIndex = PreviewTab.QuestionnaireResponse;
    component.downloadExtractionJSON();
    expect(snackBar.open).toHaveBeenCalledOnceWith('Download failed: Blocked', undefined, {duration: 3000});
  });

  it('shows copy results in a short-lived pop-up and closes it on tab changes', fakeAsync(() => {
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    tick();
    component.onExtractionCopied(true);
    expect(snackBar.open).toHaveBeenCalledOnceWith('Copied extracted resources JSON.', undefined, {duration: 3000});
    snackBar.dismiss.calls.reset();
    component.onPreviewTabSelected(PreviewTab.QuestionnaireResponse);
    expect(snackBar.dismiss).toHaveBeenCalledTimes(1);
    component.onExtractionCopied(true);
    expect(snackBar.open.calls.mostRecent().args[0]).toBe('Copied QuestionnaireResponse JSON.');
  }));

  it('cancels pending work when the preview closes', fakeAsync(() => {
    component.onPreviewTabSelected(PreviewTab.ExtractedResources);
    component.ngOnDestroy();
    tick();
    expect(exportFHIR).not.toHaveBeenCalled();
  }));
});
