import { TestBed } from '@angular/core/testing';

import { ExtensionsService } from './extensions.service';

describe('ExtensionsService', () => {
  let service: ExtensionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [ExtensionsService]});
    service = TestBed.inject(ExtensionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
