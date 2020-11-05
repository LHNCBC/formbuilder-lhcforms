import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnablewhenAnswerCodingComponent } from './enablewhen-answer-coding.component';

describe('EnablewhenAnswerCodingComponent', () => {
  let component: EnablewhenAnswerCodingComponent;
  let fixture: ComponentFixture<EnablewhenAnswerCodingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnablewhenAnswerCodingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnablewhenAnswerCodingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
