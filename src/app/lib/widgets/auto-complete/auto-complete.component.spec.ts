import {ComponentFixture, ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

import { AutoCompleteComponent } from './auto-complete.component';
import {HttpClient} from '@angular/common/http';
import fhir from 'fhir/r4';
import {By} from '@angular/platform-browser';
import {FormService} from '../../../services/form.service';
declare var LForms: any;

describe('AutoCompleteComponent', () => {
  let component: AutoCompleteComponent;
  let fixture: ComponentFixture<AutoCompleteComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach((() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, AutoCompleteComponent ],
      providers: [{provide: ComponentFixtureAutoDetect, useValue: true}, FormService]
    })
    .compileComponents()
    httpTestingController = TestBed.inject(HttpTestingController);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoCompleteComponent);
    component = fixture.componentInstance;
    component.options = {
      acOptions: {
        toolTip: 'Test placeholder',
        matchListValue: true,
        maxSelect: 1,
        suggestionMode: LForms.Def.Autocompleter.USE_STATISTICS,
        autocomp: true,
      },
      fhirOptions: {
        // fhirServer: 'https://clinicaltables.nlm.nih.gov/fhir/R4',
        // valueSetUri: 'http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions',
        fhirServer: 'https://a.com/fhir',
        valueSetUri: 'http://a.com/fhir/ValueSet/vs1',
        operation: '$expand',
        count: 7
      }
    };
  });

  it('should create', () => {
    // @ts-ignore
    expect(component).toBeTruthy();
  });
});
