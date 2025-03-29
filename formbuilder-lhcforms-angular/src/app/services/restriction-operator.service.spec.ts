import { TestBed } from '@angular/core/testing';

import { RestrictionOperatorService } from './restriction-operator.service';

describe('RestrictionOperatorService', () => {
  let service: RestrictionOperatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RestrictionOperatorService]
    });
    service = TestBed.inject(RestrictionOperatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
