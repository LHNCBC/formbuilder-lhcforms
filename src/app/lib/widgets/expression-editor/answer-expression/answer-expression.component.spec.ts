import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerExpressionComponent } from './answer-expression.component';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('ExpressionEditorComponent', () => {
  let component: AnswerExpressionComponent;
  let fixture: ComponentFixture<AnswerExpressionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers:[ HttpClient, HttpHandler ],
      declarations: [AnswerExpressionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnswerExpressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
