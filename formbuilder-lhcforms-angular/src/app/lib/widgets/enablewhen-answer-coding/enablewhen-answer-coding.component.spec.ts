import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnablewhenAnswerCodingComponent } from './enablewhen-answer-coding.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';

xdescribe('EnablewhenAnswerCodingComponent', () => {
  let component: EnablewhenAnswerCodingComponent;
  let fixture: ComponentFixture<EnablewhenAnswerCodingComponent>;

  CommonTestingModule.setUpTestBed(EnablewhenAnswerCodingComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(EnablewhenAnswerCodingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
