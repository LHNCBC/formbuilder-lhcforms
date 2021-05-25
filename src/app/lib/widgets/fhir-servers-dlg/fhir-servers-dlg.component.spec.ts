import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FhirServersDlgComponent } from './fhir-servers-dlg.component';

describe('FhirServersDlgComponent', () => {
  let component: FhirServersDlgComponent;
  let fixture: ComponentFixture<FhirServersDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FhirServersDlgComponent ]
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
