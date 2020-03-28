import { TestBed } from '@angular/core/testing';

import { ShareService } from './share-object.service';

describe('ShareService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ShareService = TestBed.get(ShareService);
    expect(service).toBeTruthy();
  });
});
