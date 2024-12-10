import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LfbSpinnerComponent } from './lfb-spinner.component';

describe('LfbSpinnerComponent', () => {
  let component: LfbSpinnerComponent;
  let fixture: ComponentFixture<LfbSpinnerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ LfbSpinnerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LfbSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
