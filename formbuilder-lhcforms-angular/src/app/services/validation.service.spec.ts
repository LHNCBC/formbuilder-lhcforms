import { TestBed } from '@angular/core/testing';

import { ValidationService } from './validation.service';
import { FormService } from './form.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ValidationService', () => {
  let service: ValidationService;
  let formServiceSpy = jasmine.createSpyObj('FormService', ['getTreeNodeById', 'updateValidationStatus', 'getTreeNodeByLinkId', 'updateLinkIdForLinkIdTracker', 'treeNodeHasDuplicateLinkIdByLinkIdTracker'  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ValidationService,
        { provide: FormService, useValue: formServiceSpy }
      ]
    });
    service = TestBed.inject(ValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
