import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { FetchService, LoincItemType } from './fetch.service';

describe('FetchService', () => {
  let service: FetchService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), FetchService]
    });
    service = TestBed.inject(FetchService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request and map the LOINC consumer-friendly display name', () => {
    let result;
    service.searchLoincItems('weight', LoincItemType.QUESTION).subscribe((items) => result = items);

    const request = httpTestingController.expectOne((req) =>
      req.url === FetchService.loincSearchUrl && req.params.get('terms') === 'weight');
    expect(request.request.params.get('df'))
      .toBe('text,LONG_COMMON_NAME,COMPONENT,SHORTNAME,CONSUMER_NAME');

    request.flush([
      1,
      ['29463-7'],
      {answers: [null], units: [null], datatype: ['REAL']},
      [[
        'Body weight',
        'Body weight',
        'Body weight',
        'Body weight',
        'Weight of the body'
      ]]
    ]);

    expect(result[0].CONSUMER_NAME).toBe('Weight of the body');
  });
});
