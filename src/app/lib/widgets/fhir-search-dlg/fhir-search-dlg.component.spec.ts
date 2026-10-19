import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed
} from '@angular/core/testing';

import { FhirSearchDlgComponent } from './fhir-search-dlg.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {TestUtil} from '../../../testing/util';
import {of, Subject, throwError} from 'rxjs';

describe('FhirSearchDlgComponent', () => {
  let component: FhirSearchDlgComponent;
  let fixture: ComponentFixture<FhirSearchDlgComponent>;

  let searchButton: HTMLButtonElement;
  let inputEl: HTMLInputElement;

  // Server-advertised parameters behind 'Any text field' and 'Resource ID'.
  const contentAndIdParameters = [{name: '_content', type: 'string'}, {name: '_id', type: 'token'}];

  afterAll(() => {
    TestBed.resetTestingModule();
  });

  CommonTestingModule.setUpTestBedConfig({imports: [FhirSearchDlgComponent]});

  beforeEach(() => {
    fixture = TestBed.createComponent(FhirSearchDlgComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    searchButton = fixture.debugElement.nativeElement.querySelector('#button-addon2');
    inputEl = fixture.debugElement.nativeElement.querySelector('.input-group input.form-control[type="search"]');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require a server-advertised resource type for contained-resource searches', fakeAsync(() => {
    spyOn(component.fhirService, 'getResourceCapabilities').and.returnValue(of([{
      resourceType: 'Practitioner',
      searchParameters: [...contentAndIdParameters, {name: 'name', type: 'string'}]
    }]));

    component.configureForContainedResourceImport();
    flush();
    fixture.detectChanges();

    expect(component.mode).toBe('contained-resource');
    expect(component.resourceTypes).toEqual(['Practitioner']);
    expect(component.canSearch()).toBeFalse();

    component.onResourceTypeChange('Practitioner');

    expect(component.canSearch()).toBeTrue();
    expect(component.searchFieldList.map((field) => field.field))
      .toEqual(['_content', '_id', 'name']);
    expect(component.searchField.field).toBe('_content');
  }));

  it('should search and return a type-qualified contained-resource selection', fakeAsync(() => {
    spyOn(component.fhirService, 'getResourceCapabilities').and.returnValue(of([{
      resourceType: 'Practitioner',
      searchParameters: contentAndIdParameters
    }]));
    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 1,
      entry: [{resource: {
        resourceType: 'Practitioner',
        id: 'p2',
        active: true,
        name: [{family: 'Roe', given: ['Jane']}]
      }}]
    } as any;
    const searchSpy = spyOn(component.fhirService, 'searchResources')
      .withArgs('Practitioner', 'Jane', '_content', {_count: 20})
      .and.returnValue(of(bundle));
    const closeSpy = spyOn(component, 'close');

    component.configureForContainedResourceImport();
    component.onResourceTypeChange('Practitioner');
    component.inputTerm = 'Jane';
    component.searchInput();
    flush();
    fixture.detectChanges();

    expect(searchSpy).toHaveBeenCalled();
    expect(component.resources.length).toBe(1);
    expect(component.getResourceDisplay(component.resources[0])).toBe('Jane Roe');

    component.selectResource(component.resources[0]);

    expect(closeSpy).toHaveBeenCalledWith({resourceType: 'Practitioner', id: 'p2'});
  }));

  [
    {
      description: 'omit Any text field and default to Resource ID without _content',
      parameters: [{name: 'status', type: 'token'}, {name: '_id', type: 'token'}, {name: 'code', type: 'token'}],
      fields: ['_id', 'status', 'code']
    },
    {
      description: 'default to the first advertised parameter without _content and _id',
      parameters: [{name: 'status', type: 'token'}, {name: 'code', type: 'token'}],
      fields: ['status', 'code']
    },
    {
      description: 'offer no search fields when none are usable',
      parameters: [{name: '_lastUpdated', type: 'date'}, {name: 'date', type: 'date'}],
      fields: []
    }
  ].forEach(({description, parameters, fields}) => {
    it(`should ${description}`, fakeAsync(() => {
      spyOn(component.fhirService, 'getResourceCapabilities').and.returnValue(of([
        {resourceType: 'Observation', searchParameters: parameters}
      ]));
      component.configureForContainedResourceImport();
      flush();
      component.onResourceTypeChange('Observation');
      fixture.detectChanges();

      expect(component.searchFieldList.map((field) => field.field)).toEqual(fields);
      expect(component.searchField?.field).toBe(fields[0]);
      expect(component.canSearch()).toBe(fields.length > 0);
    }));
  });

  it('should reset the search field when the new resource type does not offer it', fakeAsync(() => {
    spyOn(component.fhirService, 'getResourceCapabilities').and.returnValue(of([
      {resourceType: 'Practitioner', searchParameters: [...contentAndIdParameters, {name: 'name', type: 'string'}]},
      {resourceType: 'Patient', searchParameters: [{name: '_id', type: 'token'}, {name: 'name', type: 'string'}]}
    ]));
    component.configureForContainedResourceImport();
    flush();
    component.onResourceTypeChange('Practitioner');
    expect(component.searchField.field).toBe('_content');

    component.onResourceTypeChange('Patient');

    expect(component.searchFieldList.map((field) => field.field)).toEqual(['_id', 'name']);
    expect(component.searchField).toBe(component.searchFieldList[0]);
  }));

  it('should keep the advertised search fields stable between change detection passes', fakeAsync(() => {
    const capabilitiesSpy = spyOn(component.fhirService, 'getResourceCapabilities').and.returnValue(of([
      {resourceType: 'Practitioner', searchParameters: [...contentAndIdParameters, {name: 'name', type: 'string'}]},
      {resourceType: 'Patient', searchParameters: [...contentAndIdParameters, {name: 'gender', type: 'token'}]}
    ]));
    component.configureForContainedResourceImport();
    flush();
    component.onResourceTypeChange('Practitioner');

    // The template binds each field as an option value. New field objects on every pass
    // kept the view dirty, causing NG0103 in development mode.
    const practitionerFields = component.searchFieldList;
    expect(component.searchFieldList).toBe(practitionerFields);

    component.onResourceTypeChange('Patient');
    const patientFields = component.searchFieldList;
    expect(patientFields).not.toBe(practitionerFields);
    expect(patientFields.map((field) => field.field)).toEqual(['_content', '_id', 'gender']);
    expect(component.searchFieldList).toBe(patientFields);

    // Reloaded capabilities rebuild the list; the selected field follows the new objects.
    component.searchField = patientFields[2];
    capabilitiesSpy.and.returnValue(of([
      {resourceType: 'Patient', searchParameters: [
        {name: '_id', type: 'token'}, {name: 'birthdate', type: 'date'}, {name: 'gender', type: 'token'}
      ]}
    ]));
    component.retryResourceCapabilities();
    flush();
    expect(component.searchFieldList.map((field) => field.field)).toEqual(['_id', 'gender']);
    expect(component.searchField).toBe(component.searchFieldList[1]);
  }));

  /**
   * Prepare a contained-resource search whose response is controlled by the test.
   * @returns Subject that delivers the pending search response.
   */
  function startPendingPractitionerSearch(): Subject<any> {
    spyOn(component.fhirService, 'getResourceCapabilities').and.returnValue(of([
      {resourceType: 'Practitioner', searchParameters: contentAndIdParameters},
      {resourceType: 'Patient', searchParameters: contentAndIdParameters}
    ]));
    const response = new Subject<any>();
    spyOn(component.fhirService, 'searchResources').and.returnValue(response.asObservable());
    component.configureForContainedResourceImport();
    flush();
    component.onResourceTypeChange('Practitioner');
    component.inputTerm = 'Jane';
    component.searchInput();
    return response;
  }

  it('should cancel a pending search when the resource type changes', fakeAsync(() => {
    const response = startPendingPractitionerSearch();
    let loading: boolean;
    component.loading$.subscribe((value) => loading = value);
    expect(loading).toBeTrue();

    component.onResourceTypeChange('Patient');
    response.next({
      resourceType: 'Bundle', type: 'searchset', total: 5,
      entry: [{resource: {resourceType: 'Practitioner', id: 'p1'}}]
    });
    flush();

    expect(response.observed).toBeFalse();
    expect(loading).toBeFalse();
    expect(component.total).toBeUndefined();
    expect(component.resources).toBeNull();
  }));

  it('should cancel a pending search when the server changes', fakeAsync(() => {
    const response = startPendingPractitionerSearch();

    component.selectedFHIRServer = component.getServerList()[1];

    expect(response.observed).toBeFalse();
    expect(component.total).toBeUndefined();
  }));

  it('should keep searching after a failed search', fakeAsync(() => {
    spyOn(component.fhirService, 'getResourceCapabilities').and.returnValue(of([
      {resourceType: 'Practitioner', searchParameters: contentAndIdParameters}
    ]));
    spyOn(console, 'error');
    const searchSpy = spyOn(component.fhirService, 'searchResources').and.returnValues(
      throwError(() => new Error('Invalid FHIR resource type')),
      of({resourceType: 'Bundle', type: 'searchset', total: 1,
        entry: [{resource: {resourceType: 'Practitioner', id: 'p1'}}]} as any)
    );
    component.configureForContainedResourceImport();
    flush();
    component.onResourceTypeChange('Practitioner');

    component.searchInput();
    flush();
    expect(component.searchError.message).toBe('Error searching Practitioner resources.');

    component.searchInput();
    flush();
    expect(searchSpy).toHaveBeenCalledTimes(2);
    expect(component.searchError).toBeNull();
    expect(component.total).toBe(1);
    expect(component.resources.length).toBe(1);
  }));

  [
    {index: 0, field: '_content', term: 'weight', total: 64, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR5'},
    {index: 1, field: 'questionnaire-code', term: '11111-1', total: 1, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR5'},
    {index: 2, field: 'item-code', term: '22222-2', total: 1, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR5'},
    {index: 3, field: 'title:contains', term: 'vital', total: 24, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR5'},
    {index: 4, field: 'name:contains', term: 'test', total: 9, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR5'},
    {index: 0, field: '_content', term: 'weight', total: 64, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4'},
    {index: 1, field: 'code', term: '33333-3', total: 1, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4'},
    {index: 2, field: 'title:contains', term: 'vital', total: 24, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4'},
    {index: 3, field: 'name:contains', term: 'test', total: 9, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4'},
    {index: 0, field: '_content', term: 'weight', total: 64, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseDstu3'},
    {index: 1, field: 'code', term: '44444-4', total: 1, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseDstu3'},
    {index: 2, field: 'title:contains', term: 'vital', total: 24, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseDstu3'},
    {index: 3, field: 'name:contains', term: 'test', total: 9, baseUrl: 'https://lforms-fhir.nlm.nih.gov/baseDstu3'},
    ]
    .forEach((strategy) => {
    it(`should search with ${strategy.field} option (${strategy.baseUrl.replace(/https?:\/\/.+\/baseD?/, '')})`, fakeAsync(() => {
      const dummyBundle = TestUtil.createDummySearchBundle({total: strategy.total, baseUrl: strategy.baseUrl});
      const searchSpy = spyOn(component.fhirService, 'search').withArgs(strategy.term, strategy.field, {_count: 20})
        .and.returnValue(of(dummyBundle));
      const searchFieldEl = fixture.debugElement.nativeElement.querySelector('#searchField1');
      TestUtil.selectText(fixture.debugElement.nativeElement.querySelector('#SelectFHIRServer1'), strategy.baseUrl);
      fixture.detectChanges();
      TestUtil.select(searchFieldEl, strategy.index);
      TestUtil.setValue(inputEl, strategy.term);
      TestUtil.click(searchButton);
      flush();
      fixture.detectChanges();

      expect(searchSpy).toHaveBeenCalled();
      expect(component.total).toEqual(strategy.total);
      expect(component.questionnaires.length).toEqual(Math.min(strategy.total, 20));

      const nextPage = TestUtil.withButtonText(fixture.debugElement, 'Next');
      const prevPage = TestUtil.withButtonText(fixture.debugElement, 'Previous');
      fixture.detectChanges();

      expect(prevPage.attributes.disabled).toBeDefined();
      if(strategy.total > 20) {
        expect(nextPage.attributes.disabled).toBeUndefined();
      }
      else {
        expect(nextPage.attributes.disabled).toBeDefined();
      }
    }));
  });

  it('Should fetch next/prev pages', fakeAsync(() => {
    const dummyBundle = TestUtil.createDummySearchBundle({total: 65});
    const secondPageBundle = TestUtil.createDummySearchBundle({total: 65, linkRelationUrl: dummyBundle.link[1].url});
    const thirdPageBundle = TestUtil.createDummySearchBundle({total: 65, linkRelationUrl: secondPageBundle.link[1].url});
    const fourthPageBundle = TestUtil.createDummySearchBundle({total: 65, linkRelationUrl: thirdPageBundle.link[1].url});

    const searchSpy = spyOn(component.fhirService, 'search')
      .and.returnValue(of(dummyBundle));
    const pageSpy = spyOn(component.fhirService, 'getBundleByUrl')
      .and.returnValue(of(secondPageBundle));

    TestUtil.setValue(inputEl, 'test');
    TestUtil.click(searchButton);
    flush();
    fixture.detectChanges();

    const nextPage = TestUtil.withButtonText(fixture.debugElement, 'Next');
    const prevPage = TestUtil.withButtonText(fixture.debugElement, 'Previous');
    expect(searchSpy).toHaveBeenCalled(); // 1st page
    expect(prevPage.attributes.disabled).toBeDefined();
    expect(nextPage.attributes.disabled).toBeUndefined();

    TestUtil.click(nextPage.nativeElement); // Go 2nd page
    fixture.detectChanges();
    expect(pageSpy).toHaveBeenCalled();
    expect(prevPage.attributes.disabled).toBeUndefined();
    expect(nextPage.attributes.disabled).toBeUndefined();

    pageSpy.and.returnValue(of(thirdPageBundle));
    TestUtil.click(nextPage.nativeElement); // 3rd page
    fixture.detectChanges();
    expect(pageSpy).toHaveBeenCalled();
    expect(prevPage.attributes.disabled).toBeUndefined();
    expect(nextPage.attributes.disabled).toBeUndefined();

    pageSpy.and.returnValue(of(fourthPageBundle));
    TestUtil.click(nextPage.nativeElement); // 4th page
    fixture.detectChanges();
    expect(pageSpy).toHaveBeenCalled();
    expect(prevPage.attributes.disabled).toBeUndefined();
    expect(nextPage.attributes.disabled).toBeDefined();

    pageSpy.and.returnValue(of(thirdPageBundle));
    TestUtil.click(prevPage.nativeElement); // 3rd page
    fixture.detectChanges();
    expect(pageSpy).toHaveBeenCalled();
    expect(prevPage.attributes.disabled).toBeUndefined();
    expect(nextPage.attributes.disabled).toBeUndefined();

    pageSpy.and.returnValue(of(secondPageBundle));
    TestUtil.click(prevPage.nativeElement); // 2nd page
    fixture.detectChanges();
    expect(pageSpy).toHaveBeenCalled();
    expect(prevPage.attributes.disabled).toBeUndefined();
    expect(nextPage.attributes.disabled).toBeUndefined();

    pageSpy.and.returnValue(of(dummyBundle));
    TestUtil.click(prevPage.nativeElement); // 1st page
    fixture.detectChanges();
    expect(pageSpy).toHaveBeenCalled();
    expect(nextPage.attributes.disabled).toBeUndefined();
    expect(prevPage.attributes.disabled).toBeDefined();
  }));
});
