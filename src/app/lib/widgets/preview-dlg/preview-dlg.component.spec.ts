import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ElementRef} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {PreviewData, PreviewDlgComponent} from './preview-dlg.component';
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
    data = {questionnaire: {resourceType: 'Questionnaire', status: 'draft', item: []}};
    formService = {
      lformsVersion: '44.0.0',
      convertFromR5: jasmine.createSpy('convertFromR5').and.callFake(questionnaire => questionnaire),
      getQuantityComparatorCompatibilityError: jasmine.createSpy('comparatorError').and.returnValue('')
    };
    spyOn(LForms.Util, 'setFHIRContext');
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
        }}
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

  it('generates both snapshots in one R5 call using the widget container', fakeAsync(() => {
    component.onPreviewTabSelected(2);
    expect(component.extractionInProgress).toBeTrue();
    tick();
    expect(exportFHIR).toHaveBeenCalledOnceWith(
      'QuestionnaireResponse', 'R5', component.extractionFormContainer.nativeElement, {extract: true}
    );
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(JSON.parse(component.extractedResourcesJSON)).toEqual(bundle);
    expect(component.extractionJSON).toBe(component.extractedResourcesJSON);
    expect(component.extractionViewLabel).toBe('extracted resources');
    component.onPreviewTabSelected(1);
    tick();
    expect(component.extractionJSON).toBe(component.questionnaireResponseJSON);
    expect(component.extractionViewLabel).toBe('QuestionnaireResponse');
    component.onPreviewTabSelected(2);
    tick();
    expect(component.extractionJSON).toBe(component.extractedResourcesJSON);
    expect(exportFHIR).toHaveBeenCalledTimes(1);
    expect(component.extractionInProgress).toBeFalse();
  }));

  it('generates the paired snapshots when Questionnaire Response is opened first', fakeAsync(() => {
    component.onPreviewTabSelected(1);
    tick();
    expect(JSON.parse(component.extractionJSON)).toEqual(response);
    component.onPreviewTabSelected(2);
    tick();
    expect(JSON.parse(component.extractionJSON)).toEqual(bundle);
    expect(exportFHIR).toHaveBeenCalledTimes(1);
  }));

  it('waits for form readiness and regenerates only on refresh or reentry', fakeAsync(() => {
    component.formReady = false;
    component.onPreviewTabSelected(1);
    tick();
    expect(exportFHIR).not.toHaveBeenCalled();
    component.handleFormReady();
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(1);
    component.handleFormChange();
    tick();
    expect(component.extractionStatus).toContain('Form answers changed');
    expect(exportFHIR).toHaveBeenCalledTimes(1);
    component.refreshExtraction();
    component.refreshExtraction();
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(2);
    component.onPreviewTabSelected(0);
    component.onPreviewTabSelected(2);
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(3);
  }));

  it('does not extract on the Questionnaire JSON tab but refreshes when returning to snapshots', fakeAsync(() => {
    component.onPreviewTabSelected(1);
    tick();
    component.onPreviewTabSelected(3);
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(1);
    component.onPreviewTabSelected(2);
    tick();
    expect(exportFHIR).toHaveBeenCalledTimes(2);
  }));

  it('does not use the Questionnaire JSON version selector for extraction', fakeAsync(() => {
    component.onJsonVersionSelected(2);
    component.onPreviewTabSelected(2);
    tick();
    expect(exportFHIR.calls.mostRecent().args[1]).toBe('R5');
  }));

  it('never falls back to another form when the preview container is missing', fakeAsync(() => {
    component.extractionFormContainer = undefined;
    component.onPreviewTabSelected(2);
    tick();
    expect(exportFHIR).not.toHaveBeenCalled();
    expect(component.extractionError).toContain('unavailable');
    expect(component.questionnaireResponseJSON).toBe('');
  }));

  it('detects template settings at the root and nested item scopes', () => {
    data.questionnaire.extension = [{url: `${EXTENSION_URL_TEMPLATE_EXTRACT}Bundle`}];
    component.ngOnInit();
    expect(component.hasTemplateExtraction).toBeTrue();
    delete data.questionnaire.extension;
    data.questionnaire.item = [{linkId: 'group', type: 'group', item: [{
      linkId: 'value', type: 'decimal', extension: [{url: EXTENSION_URL_TEMPLATE_EXTRACT}]
    }]}];
    component.ngOnInit();
    expect(component.hasTemplateExtraction).toBeTrue();
  });

  it('keeps the response available when no resources are extracted', fakeAsync(() => {
    exportFHIR.and.returnValue([response]);
    component.onPreviewTabSelected(2);
    tick();
    expect(component.extractedResourcesJSON).toBe('');
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(component.extractionNotice).toContain('no resources were produced');
    expect(component.extractionError).toBe('');
  }));

  it('preserves standalone observations and a template Bundle from older engines', fakeAsync(() => {
    formService.lformsVersion = '38.7.0';
    const observation = {resourceType: 'Observation', status: 'final'};
    exportFHIR.and.returnValue([response, observation, bundle]);
    component.onPreviewTabSelected(2);
    tick();
    expect(JSON.parse(component.extractedResourcesJSON)).toEqual([observation, bundle]);
  }));

  it('warns about an unsupported engine while allowing response inspection', fakeAsync(() => {
    formService.lformsVersion = '34.3.0';
    exportFHIR.and.returnValue(response);
    component.onPreviewTabSelected(2);
    tick();
    expect(component.extractionUnavailable).toContain('38.7.0 or later');
    expect(component.extractionUnavailable).toContain('34.3.0');
    expect(exportFHIR.calls.mostRecent().args[3]).toEqual({extract: false});
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(component.extractedResourcesJSON).toBe('');
  }));

  it('clears stale output after failure and labels a separately exported diagnostic response', fakeAsync(() => {
    component.onPreviewTabSelected(2);
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
    expect(component.extractionNotice).toContain('exported separately');
    expect(JSON.parse(component.questionnaireResponseJSON)).toEqual(response);
    expect(component.extractedResourcesJSON).toBe('');
    exportFHIR.and.returnValue([response, bundle]);
    component.refreshExtraction();
    tick();
    expect(component.extractionError).toBe('');
    expect(component.extractionNotice).toBe('');
    expect(JSON.parse(component.extractedResourcesJSON)).toEqual(bundle);
  }));

  it('reports response export failures and invalid engine results explicitly', fakeAsync(() => {
    exportFHIR.and.returnValue(null);
    component.onPreviewTabSelected(2);
    tick();
    expect(component.extractionError).toContain('did not return a QuestionnaireResponse');
    expect(component.extractionError).toContain('Response export also failed');
    expect(component.questionnaireResponseJSON).toBe('');
    expect(component.extractionInProgress).toBeFalse();
  }));

  it('cancels a pending extraction when the widget reports an error', fakeAsync(() => {
    component.onPreviewTabSelected(2);
    component.handleLFormsError({detail: 'Unable to render'});
    tick();
    expect(exportFHIR).not.toHaveBeenCalled();
    expect(component.formReady).toBeFalse();
    expect(component.extractionInProgress).toBeFalse();
    expect(component.extractionError).toContain('Unable to render');
  }));

  it('downloads the selected JSON and releases object URLs', async () => {
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:preview');
    const revokeUrl = spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').and.returnValue(true);
    component.questionnaireResponseJSON = JSON.stringify(response);
    component.activeTopLevelTabIndex = 1;
    component.downloadExtractionJSON();
    const blob = createUrl.calls.mostRecent().args[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual(response);
    component.downloadExtractionJSON();
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview');
    component.ngOnDestroy();
    expect(revokeUrl).toHaveBeenCalledTimes(2);
  });

  it('reports clipboard failures', () => {
    component.onExtractionCopied(false);
    expect(component.extractionStatus).toContain('Copy failed');
  });

  it('cancels pending work when the preview closes', fakeAsync(() => {
    component.onPreviewTabSelected(2);
    component.ngOnDestroy();
    tick();
    expect(exportFHIR).not.toHaveBeenCalled();
  }));
});
