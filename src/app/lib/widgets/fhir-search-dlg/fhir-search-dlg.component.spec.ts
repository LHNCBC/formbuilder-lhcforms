import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed
} from '@angular/core/testing';

import { FhirSearchDlgComponent } from './fhir-search-dlg.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {TestUtil} from '../../../testing/util';
import {of} from 'rxjs';

describe('FhirSearchDlgComponent', () => {
  let component: FhirSearchDlgComponent;
  let fixture: ComponentFixture<FhirSearchDlgComponent>;

  let searchButton: HTMLButtonElement;
  let inputEl: HTMLInputElement;

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
      searchParameters: [{name: 'name', type: 'string'}]
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
  }));

  it('should search and return a type-qualified contained-resource selection', fakeAsync(() => {
    spyOn(component.fhirService, 'getResourceCapabilities').and.returnValue(of([{
      resourceType: 'Practitioner',
      searchParameters: []
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
