import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoCompleteComponent, Options } from './auto-complete.component';
import {CommonTestingModule, TestComponent} from '../../../testing/common-testing.module';
import {HttpClientModule} from '@angular/common/http';
import {MatAutocompleteModule} from '@angular/material/autocomplete';

describe('AutoCompleteComponent', () => {
  let component: AutoCompleteComponent;
  let fixture: ComponentFixture<AutoCompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutoCompleteComponent ],
      imports: [HttpClientModule, MatAutocompleteModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoCompleteComponent);
    component = fixture.componentInstance;
    component.options = {
      searchUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire',
      httpOptions: {
        observe: 'body' as const,
        responseType: 'json' as const
      }
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
