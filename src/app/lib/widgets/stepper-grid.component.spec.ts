import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StepperGridComponent } from './stepper-grid.component';

describe('StepperGridComponent', () => {
  let component: StepperGridComponent;
  let fixture: ComponentFixture<StepperGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StepperGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StepperGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
