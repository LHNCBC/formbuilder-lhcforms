import { TestBed } from '@angular/core/testing';

import { AnswerOptionComponent } from './answer-option.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {TestingService} from '../../../testing/testing.service';

xdescribe('AnswerOptionComponent', () => {
  let component: AnswerOptionComponent;
  let service: TestingService;

  CommonTestingModule.setUpTestBedConfig({declarations: [AnswerOptionComponent]});
  beforeEach(() => {
    service = TestBed.inject(TestingService);
    component = service.createComponent(AnswerOptionComponent) as AnswerOptionComponent;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });
});
