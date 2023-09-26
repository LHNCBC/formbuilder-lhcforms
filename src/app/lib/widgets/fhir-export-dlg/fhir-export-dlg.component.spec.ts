import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FhirExportDlgComponent } from './fhir-export-dlg.component';
import {NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientModule} from '@angular/common/http';

describe('FhirExportDlgComponent', () => {
  let component: FhirExportDlgComponent;
  let fixture: ComponentFixture<FhirExportDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FhirExportDlgComponent ],
      imports: [NgbModule, HttpClientModule],
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
