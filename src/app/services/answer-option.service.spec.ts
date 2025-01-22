import { TestBed } from '@angular/core/testing';

import { AnswerOptionService } from './answer-option.service';

describe('AnswerOptionService', () => {
  let service: AnswerOptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnswerOptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
