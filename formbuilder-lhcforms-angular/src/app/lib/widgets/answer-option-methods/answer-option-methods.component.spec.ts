import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerOptionMethodsComponent } from './answer-option-methods.component';

describe('LfbAnswerOptionComponent', () => {
  let component: AnswerOptionMethodsComponent;
  let fixture: ComponentFixture<AnswerOptionMethodsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ AnswerOptionMethodsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnswerOptionMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
