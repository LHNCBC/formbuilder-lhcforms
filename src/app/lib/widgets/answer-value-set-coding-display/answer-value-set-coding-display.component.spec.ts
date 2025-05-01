import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerValueSetCodingDisplayComponent } from './answer-value-set-coding-display.component';

describe('AnswerValueSetCodingDisplayComponent', () => {
  let component: AnswerValueSetCodingDisplayComponent;
  let fixture: ComponentFixture<AnswerValueSetCodingDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnswerValueSetCodingDisplayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnswerValueSetCodingDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
