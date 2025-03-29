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

  CommonTestingModule.setUpTestBedConfig({declarations: [FhirSearchDlgComponent]});

  beforeEach(() => {
    fixture = TestBed.createComponent(FhirSearchDlgComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    searchButton = fixture.debugElement.nativeElement.querySelector('#button-addon2');
    inputEl = fixture.debugElement.nativeElement.querySelector('.input-group input.form-control[type="text"]');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  [
    {index: 0, field: '_content', term: 'weight', total: 64},
    {index: 1, field: 'code', term: '11111-1', total: 1},
    {index: 2, field: 'title:contains', term: 'vital', total: 24},
    {index: 3, field: 'name:contains', term: 'test', total: 9}
    ]
    .forEach((strategy) => {
    it('should search with '+strategy.field+' option', fakeAsync(() => {
      const dummyBundle = TestUtil.createDummySearchBundle({total: strategy.total});
      const searchSpy = spyOn(component.fhirService, 'search').withArgs(strategy.term, strategy.field, {_count: 20})
        .and.returnValue(of(dummyBundle));
      const searchFieldEl = fixture.debugElement.nativeElement.querySelector('#searchField1');
      TestUtil.setValue(inputEl, strategy.term);
      TestUtil.select(searchFieldEl, strategy.index);
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
