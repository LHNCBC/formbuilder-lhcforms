import { TestBed } from '@angular/core/testing';

import { FetchService } from './fetch.service';
import {CommonTestingModule} from '../testing/common-testing.module';

describe('FetchService', () => {
  let service: FetchService;

  CommonTestingModule.setUpTestBedConfig({providers: [FetchService]});

  beforeEach(() => {
    service = TestBed.inject(FetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
