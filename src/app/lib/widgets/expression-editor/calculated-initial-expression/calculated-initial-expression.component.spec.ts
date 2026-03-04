import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculatedInitialExpressionComponent } from './calculated-initial-expression.component';

describe('CalculatedInitialExpressionComponent', () => {
  let component: CalculatedInitialExpressionComponent;
  let fixture: ComponentFixture<CalculatedInitialExpressionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatedInitialExpressionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalculatedInitialExpressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
