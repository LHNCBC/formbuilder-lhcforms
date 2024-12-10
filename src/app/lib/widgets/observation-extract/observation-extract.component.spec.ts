import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationExtractComponent } from './observation-extract.component';

describe('ObservationExtractComponent', () => {
  let component: ObservationExtractComponent;
  let fixture: ComponentFixture<ObservationExtractComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ ObservationExtractComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservationExtractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
