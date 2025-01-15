import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FhirServersDlgComponent } from './fhir-servers-dlg.component';
import {NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {CommonTestingModule} from '../../../testing/common-testing.module';

describe('FhirServersDlgComponent', () => {
  let component: FhirServersDlgComponent;
  let fixture: ComponentFixture<FhirServersDlgComponent>;

  CommonTestingModule.setUpTestBedConfig({
    declarations: [ FhirServersDlgComponent ],
    imports: [NgbModule, FormsModule, HttpClientTestingModule],
    providers: [NgbActiveModal]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FhirServersDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
