import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FhirServersDlgComponent } from './fhir-servers-dlg.component';
import {NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';

describe('FhirServersDlgComponent', () => {
  let component: FhirServersDlgComponent;
  let fixture: ComponentFixture<FhirServersDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FhirServersDlgComponent ],
      imports: [NgbModule],
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
