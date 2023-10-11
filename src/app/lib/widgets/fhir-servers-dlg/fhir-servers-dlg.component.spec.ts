import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FhirServersDlgComponent } from './fhir-servers-dlg.component';
import {NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {FormService} from '../../../services/form.service';
import {FhirService} from '../../../services/fhir.service';
import {HttpClientModule} from '@angular/common/http';

describe('FhirServersDlgComponent', () => {
  let component: FhirServersDlgComponent;
  let fixture: ComponentFixture<FhirServersDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FhirServersDlgComponent ],
      imports: [NgbModule, FormsModule, HttpClientModule],
      providers: [NgbActiveModal]
    })
    .compileComponents();
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
