import { TestBed } from '@angular/core/testing';

import { ShareObjectService } from './share-object.service';

describe('ShareService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ShareObjectService = TestBed.inject(ShareObjectService);
    expect(service).toBeTruthy();
  });
});
