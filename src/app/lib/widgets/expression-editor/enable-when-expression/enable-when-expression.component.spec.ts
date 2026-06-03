import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableWhenExpressionComponent } from './enable-when-expression.component';

describe('EnableWhenExpressionComponent', () => {
  let component: EnableWhenExpressionComponent;
  let fixture: ComponentFixture<EnableWhenExpressionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnableWhenExpressionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnableWhenExpressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
