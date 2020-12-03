import { TestBed } from '@angular/core/testing';

import { FetchService } from './fetch.service';

describe('FetchService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FetchService = TestBed.inject(FetchService);
    expect(service).toBeTruthy();
  });
});
