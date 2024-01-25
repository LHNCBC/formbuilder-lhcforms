import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnomedComponent } from './snomed.component';

describe('SnomedComponent', () => {
  let component: SnomedComponent;
  let fixture: ComponentFixture<SnomedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnomedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnomedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
