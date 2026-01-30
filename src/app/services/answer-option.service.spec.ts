import { TestBed } from '@angular/core/testing';
import { AnswerOptionService } from './answer-option.service';
import { FormService } from './form.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AnswerOptionService', () => {
  let service: AnswerOptionService;
  let formServiceSpy = jasmine.createSpyObj('FormService', ['getTreeNodeById', 'updateValidationStatus', 'getTreeNodeByLinkId', 'updateLinkIdForLinkIdTracker', 'treeNodeHasDuplicateLinkIdByLinkIdTracker'  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AnswerOptionService,
        { provide: FormService, useValue: formServiceSpy }
      ]
    });
    service = TestBed.inject(AnswerOptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});