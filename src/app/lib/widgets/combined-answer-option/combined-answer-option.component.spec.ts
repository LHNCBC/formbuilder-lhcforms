import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombinedAnswerOptionComponent } from './combined-answer-option.component';

xdescribe('LfbAnswerOptionComponent', () => {
  let component: CombinedAnswerOptionComponent;
  let fixture: ComponentFixture<CombinedAnswerOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CombinedAnswerOptionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombinedAnswerOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
