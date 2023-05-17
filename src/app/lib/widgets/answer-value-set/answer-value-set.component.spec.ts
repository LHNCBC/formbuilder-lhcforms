import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerValueSetComponent } from './answer-value-set.component';

describe('AnswerValueSetComponent', () => {
  let component: AnswerValueSetComponent;
  let fixture: ComponentFixture<AnswerValueSetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnswerValueSetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnswerValueSetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
