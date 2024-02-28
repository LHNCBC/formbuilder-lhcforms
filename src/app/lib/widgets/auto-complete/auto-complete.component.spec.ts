import {ComponentFixture, ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

import { AutoCompleteComponent } from './auto-complete.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

describe('AutoCompleteComponent', () => {
  let component: AutoCompleteComponent;
  let fixture: ComponentFixture<AutoCompleteComponent>;
  let httpTestingController: HttpTestingController;

  CommonTestingModule.setUpTestBedConfig({
    imports: [HttpClientTestingModule],
    providers: [{provide: ComponentFixtureAutoDetect, useValue: true}]
  });

  beforeEach(async() => {
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoCompleteComponent);
    component = fixture.componentInstance;
    component.options = {
      acOptions: {
        toolTip: 'Test placeholder',
        matchListValue: true,
        maxSelect: 1,
        sort: false,
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
