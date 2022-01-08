import { TestBed } from '@angular/core/testing';

import { SharedObjectService } from './shared-object.service';

describe('ShareService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SharedObjectService = TestBed.inject(SharedObjectService);
    expect(service).toBeTruthy();
  });
});
