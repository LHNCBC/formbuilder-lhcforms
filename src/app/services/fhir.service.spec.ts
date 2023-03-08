import {TestBed} from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {HttpResponse, HttpRequest} from '@angular/common/http';
import fhir from 'fhir/r4';

import { FhirService } from './fhir.service';
import {Observable} from 'rxjs';
import {fhirclient} from 'fhirclient/lib/types';
import RequestOptions = fhirclient.RequestOptions;
import {TestUtil} from '../testing/util';

describe('FhirService', () => {
  let service: FhirService;
  const dummyQ: fhir.Questionnaire = {resourceType: 'Questionnaire', status: 'draft', id: '12345-6'};

  const testResource: fhir.Questionnaire = {
    resourceType: 'Questionnaire',
    status: 'draft',
    id: '12345',
    title: 'Mock questionnaire',
    date: '2021-01-01',
    item: [{
      linkId: 'abc',
      type: 'string'
    }]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [FhirService]
    });
    service = TestBed.inject(FhirService);
  });

  it('should create this service', () => {
    expect(service).toBeTruthy();
    const serverUrl = service.getSmartClient().getState('serverUrl');
    expect(service.getFhirServer().endpoint).toBe(serverUrl);
  });

  it('Should read()', (done) => {
    // Ideally would like to intercept underlying XHR requests and mock them. For some reason angular test bed modules
    // are not intercepting those calls from fhirclient.js.
    // Alternatively spy on smart client api calls and mock the responses.
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({url: 'Questionnaire/12345-6?_format=application/fhir+json'})
      .and.returnValue(Promise.resolve(dummyQ));
    service.read('12345-6').subscribe((q) => {
      expect(q).toBe(dummyQ);
      done();
    }, (error) => {
      done.fail(error);
    });
    expect(reqSpy).toHaveBeenCalled();
  });

  it('should read() fail', (done) => {
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({url: 'Questionnaire/UNKNOWN?_format=application/fhir+json'})
      .and.returnValue(Promise.reject({status: 404, statusText: 'Not found'}));
    service.read('UNKNOWN').subscribe((q) => {
      done.fail('Not expected to resolve!');
    }, (error) => {
      expect(error.status).toBe(404);
      done();
    });
    expect(reqSpy).toHaveBeenCalled();
  });

  it('should search()', (done) => {
    const dummyBundle: fhir.Bundle = TestUtil.createDummySearchBundle({total: 1});
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .and.callFake((requestOptions: RequestOptions): Promise<any> => {
        return new Promise<any>((resolve, reject) => {
          try {
            const requestParams: any = {};
            const re = new RegExp('^[^\?]*\\?(.+)$').exec(requestOptions.url as string)[1].split('&')
              .reduce((acc, p) => {
                const nv = p.split('=');
                requestParams[nv[0]] = nv[1];
                }, requestParams);
            expect(requestParams.dummyField).toBe('dummySearchTerm');
            expect(requestParams._sort).toBe('-_lastUpdated');
            expect(requestParams._total).toBe('accurate');
            expect(requestParams._format).toBe('application/fhir+json');
            resolve(dummyBundle);
          }
          catch(error) {
            reject(error);
          }
        });
      });

    service.search('dummySearchTerm', 'dummyField').subscribe((bundle) => {
      expect(bundle).toBe(dummyBundle);
      done();
    }, (error) => {
      done.fail(error);
    });
    expect(reqSpy).toHaveBeenCalled();
  });

  it('Should create() fail', (done) => {
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({
        url: 'Questionnaire',
        method: 'POST',
        body: JSON.stringify(dummyQ),
        headers: {'content-type': 'application/json'}
      })
      .and.returnValue(Promise.reject({status: 400, statusText: 'Bad Request'}));
    service.create(JSON.stringify(dummyQ), null).subscribe((q) => {
      done.fail('Not expected to resolve!');
    }, (error) => {
      expect(error.status).toBe(400);
      done();
    });
    expect(reqSpy).toHaveBeenCalled();
  });

  it('Should create()', (done) => {
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({
        url: 'Questionnaire',
        method: 'POST',
        body: JSON.stringify(dummyQ),
        headers: {'content-type': 'application/json'}
      })
      .and.returnValue(Promise.resolve(dummyQ));

    service.create(JSON.stringify(dummyQ), null).subscribe((q) => {
      expect(q).toBe(dummyQ);
      done();
    }, (error) => {
      done.fail(error);
    });
    expect(reqSpy).toHaveBeenCalled();
  });

  it('Should update() fail', (done) => {
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({
        url: 'Questionnaire/12345-6',
        method: 'PUT',
        body: JSON.stringify(dummyQ),
        headers: {'content-type': 'application/json'}
      })
      .and.returnValue(Promise.reject({status: 400, statusText: 'Bad Request'})); // Test rejection

    service.update(JSON.stringify(dummyQ), null).subscribe((q) => {
      done.fail('Not expected to resolve!');
    }, (error) => {
      expect(error.status).toBe(400);
      done();
    });

    expect(reqSpy).toHaveBeenCalled();
  });

  it('Should update()', (done) => {
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({
        url: 'Questionnaire/12345-6',
        method: 'PUT',
        body: JSON.stringify(dummyQ),
        headers: {'content-type': 'application/json'}
      })
      .and.returnValue(Promise.resolve(dummyQ));

    service.update(JSON.stringify(dummyQ), null).subscribe((q) => {
      expect(q).toBe(dummyQ);
      done();
    }, (error) => {
      done.fail(error);
    });
    expect(reqSpy).toHaveBeenCalled();
  });
});
