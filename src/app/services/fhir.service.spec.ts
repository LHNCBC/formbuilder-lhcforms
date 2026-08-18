import {TestBed} from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import fhir from 'fhir/r4';

import { FhirService } from './fhir.service';
import {fhirclient} from 'fhirclient/lib/types';
import RequestOptions = fhirclient.RequestOptions;
import {TestUtil} from '../testing/util';
import {CommonTestingModule} from '../testing/common-testing.module';
import {FormService} from "./form.service";

/**
 * Create spy on http requests of fhirClient.
 * @param fhirClient - fhirClient object.
 * @param reqOptions - http request options
 * @param returnValue - Mocked return value.
 * @param resolveFlag - Reject or resolve the promise.
 */
const createSpy = (fhirClient, reqOptions, returnValue: any, resolveFlag: boolean) => {
  return spyOn(fhirClient, 'fhirRequest')
    .and.callFake((uri, requestOptions: RequestOptions): Promise<any> => {
      return new Promise<any>((resolve, reject) => {
        try {
          Object.keys(reqOptions).forEach((k) => {
            if(k === 'body') {
              // BOdy strings are not going to match. Convert to objects and compare.
              expect(JSON.parse(<string>requestOptions[k])).toEqual(JSON.parse(<string>reqOptions[k]));
            } else if(k === 'url') {
              expect(uri).toEqual(reqOptions[k]);
            } else {
              expect(requestOptions[k]).toEqual(reqOptions[k]);
            }
          });
          if(resolveFlag) {
            resolve(returnValue);
          }
          else {
            reject(returnValue);
          }
        }
        catch(error) {
          throw error;
        }
      });
    });
}

describe('FhirService', () => {
  let service: FhirService;
  let formService: FormService;
  let dummyQ: fhir.Questionnaire;

  CommonTestingModule.setUpTestBedConfig({
    imports: [ HttpClientTestingModule ]
  });

  beforeEach(() => {
    service = TestBed.inject(FhirService);
    formService = TestBed.inject(FormService);
    dummyQ = formService.convertFromR5({resourceType: 'Questionnaire', status: 'draft', id: '12345-6', item: []}, service.getFhirServer().version);
  });

  it('should create this service', () => {
    expect(service).toBeTruthy();
    const serverUrl = service.getSmartClient().getState('serverUrl');
    expect(service.getFhirServer().endpoint).toBe(serverUrl);
    expect(service.getDefaultFhirServer().endpoint).toBe('https://lforms-fhir.nlm.nih.gov/baseR5');
  });

  it('should announce changes to the selected FHIR server', () => {
    const selectedServers = [];
    const newServer = {
      endpoint: 'https://example.org/fhir',
      version: 'R4' as const
    };
    service.fhirServerChanges$.subscribe((server) => selectedServers.push(server));

    service.setFhirServer(newServer);

    expect(selectedServers).toEqual([newServer]);
    expect(service.getFhirServer()).toBe(newServer);
  });

  it('should read()', (done) => {
    // Ideally would like to intercept underlying XHR requests and mock them. For some reason angular test bed modules
    // are not intercepting those calls from fhirclient.js.
    // Alternatively spy on smart client api calls and mock the responses.
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({url: 'Questionnaire/12345-6?_format=application/fhir+json'})
      .and.returnValue(Promise.resolve(dummyQ));
    service.read('12345-6').subscribe({next: (q) => {
      expect(reqSpy).toHaveBeenCalled();
      delete q.meta; // Meta is generated in LForms conversion, ignore.
      expect(q).toEqual(dummyQ);
      done();
    }, error: (error) => {
      done.fail(error);
    }});
  });

  it('should read() fail', (done) => {
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({url: 'Questionnaire/UNKNOWN?_format=application/fhir+json'})
      .and.returnValue(Promise.reject({status: 404, statusText: 'Not found'}));
    service.read('UNKNOWN').subscribe({next: (q) => {
      done.fail('Not expected to resolve!');
    }, error: (error) => {
      expect(reqSpy).toHaveBeenCalled();
      expect(error.status).toBe(404);
      done();
    }});
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

    service.search('dummySearchTerm', 'dummyField').subscribe({next: (bundle) => {
      expect(reqSpy).toHaveBeenCalled();
      expect(bundle).toEqual(dummyBundle);
      done();
    }, error: (error) => {
      done.fail(error);
    }});
  });

  it('Should create() fail', (done) => {
    const reqSpy = createSpy(service.getSmartClient(), {
      url: 'Questionnaire',
      method: 'POST',
      body: JSON.stringify(dummyQ),
      headers: {'content-type': 'application/json'}
    }, {status: 400, statusText: 'Bad Request'}, false);

    service.create(JSON.stringify(dummyQ), null).subscribe({next: (q) => {
      done.fail('Not expected to resolve!');
    }, error: (error) => {
      expect(reqSpy).toHaveBeenCalled();
      expect(error.status).toBe(400);
      done();
    }});
  });

  it('Should create()', (done) => {
    const reqSpy = createSpy(service.getSmartClient(), {
      url: 'Questionnaire',
      method: 'POST',
      body: JSON.stringify(dummyQ),
      headers: {'content-type': 'application/json'}
    }, dummyQ, true);

    service.create(JSON.stringify(dummyQ), null).subscribe({next: (q) => {
      expect(reqSpy).toHaveBeenCalled();
      expect(q).toEqual(dummyQ);
      done();
    }, error: (error) => {
      done.fail(error);
    }});
  });

  it('should report an incompatible ad comparator before exporting to an R4 server', (done) => {
    const r4Server = service.fhirServerList.find(({version}) => version === 'R4');
    service.setFhirServer(r4Server);
    const createSpy = spyOn(service.getSmartClient(), 'create');
    const questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      useContext: [{
        code: {code: 'age'},
        valueQuantity: {value: 10, comparator: 'ad', unit: 'mL'}
      }]
    } as unknown as fhir.Questionnaire;

    service.create(questionnaire, null).subscribe({
      next: () => done.fail('Not expected to export an R5-only comparator to R4.'),
      error: (error) => {
        expect(error.message).toBe(FormService.R5_QUANTITY_COMPARATOR_ERROR);
        expect(createSpy).not.toHaveBeenCalled();
        done();
      }
    });
  });

  it('Should update() fail', (done) => {
    const reqSpy = createSpy(service.getSmartClient(), {
        url: 'Questionnaire/12345-6',
        method: 'PUT',
        body: JSON.stringify(dummyQ),
        headers: {'content-type': 'application/json'}
      }, {status: 400, statusText: 'Bad Request'}, false); // Test rejection

    service.update(JSON.stringify(dummyQ), null).subscribe({next: (q) => {
      done.fail('Not expected to resolve!');
    }, error: (error) => {
        expect(reqSpy).toHaveBeenCalled();
        expect(error.status).toBe(400);
        done();
      }});
  });

  it('Should update()', (done) => {
    const reqSpy = createSpy(service.getSmartClient(), {
        url: 'Questionnaire/12345-6',
        method: 'PUT',
        body: JSON.stringify(dummyQ),
        headers: {'content-type': 'application/json'}
      }, dummyQ, true);

    service.update(JSON.stringify(dummyQ), null).subscribe({next: (q) => {
      expect(reqSpy).toHaveBeenCalled();
      expect(q).toEqual(dummyQ);
      done();
    }, error: (error) => {
      done.fail(error);
    }});
  });
});
