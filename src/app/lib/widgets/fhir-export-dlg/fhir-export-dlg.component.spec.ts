import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FhirExportDlgComponent } from './fhir-export-dlg.component';
import {NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('FhirExportDlgComponent', () => {
  let component: FhirExportDlgComponent;
  let fixture: ComponentFixture<FhirExportDlgComponent>;

  beforeEach( () => {
    TestBed.configureTestingModule({
      declarations: [ FhirExportDlgComponent ],
      imports: [NgbModule, HttpClientTestingModule],
      providers: [NgbActiveModal]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FhirExportDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
