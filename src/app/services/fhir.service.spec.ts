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

  it('should read a type-neutral resource without version conversion', (done) => {
    const patient = {resourceType: 'Patient', id: 'patient-1', active: true} as fhir.Patient;
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({url: 'Patient/patient-1?_format=application/fhir+json'})
      .and.returnValue(Promise.resolve(patient));

    service.readResource('Patient', 'patient-1').subscribe({next: (resource) => {
      expect(reqSpy).toHaveBeenCalled();
      expect(resource).toBe(patient);
      done();
    }, error: done.fail});
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
                requestParams[decodeURIComponent(nv[0])] = decodeURIComponent(nv[1]);
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

  it('should search a caller-selected resource type', (done) => {
    const dummyBundle: fhir.Bundle = {resourceType: 'Bundle', type: 'searchset'};
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .and.callFake((requestOptions: RequestOptions): Promise<any> => {
        expect(requestOptions.url).toContain('Practitioner?');
        expect(requestOptions.url).toContain('_id=p1');
        return Promise.resolve(dummyBundle);
      });

    service.searchResources('Practitioner', 'p1', '_id').subscribe({next: (bundle) => {
      expect(reqSpy).toHaveBeenCalled();
      expect(bundle).toBe(dummyBundle);
      done();
    }, error: done.fail});
  });

  it('should send search text with reserved characters as one parameter value', (done) => {
    const dummyBundle: fhir.Bundle = {resourceType: 'Bundle', type: 'searchset'};
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .and.returnValue(Promise.resolve(dummyBundle));

    service.searchResources('Patient', 'a&b=c #1+d/e', 'name:contains').subscribe({next: () => {
      const url = reqSpy.calls.mostRecent().args[0]['url'] as string;
      const params = new URL(url, 'http://example.org/fhir/').searchParams;
      expect(params.get('name:contains')).toBe('a&b=c #1+d/e');
      expect(params.get('_format')).toBe('application/fhir+json');
      expect(params.has('b')).toBeFalse();
      expect(url).not.toContain('#');
      expect(url).toContain('name:contains=');
      done();
    }, error: done.fail});
  });

  it('should encode the entries of an array value and join them with a literal comma', () => {
    expect(service.queryToString({_sort: ['-_lastUpdated', 'title'], _count: 20}))
      .toBe('_sort=-_lastUpdated,title&_count=20');
    expect(service.queryToString(null)).toBeNull();
  });

  it('should escape FHIR search special characters in search text before encoding it', (done) => {
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .and.returnValue(Promise.resolve({resourceType: 'Bundle', type: 'searchset'}));

    service.searchResources('Patient', 'Smith, John $1 a|b c\\d', 'name').subscribe({next: () => {
      const url = reqSpy.calls.mostRecent().args[0]['url'] as string;
      expect(new URL(url, 'http://example.org/fhir/').searchParams.get('name'))
        .toBe('Smith\\, John \\$1 a\\|b c\\\\d');
      expect(url).toContain('name=Smith%5C%2C%20John');
      done();
    }, error: done.fail});
  });

  it('should escape search text according to the search parameter type', () => {
    expect(service.escapeSearchValue('a,b$c|d\\e')).toBe('a\\,b\\$c\\|d\\\\e');
    expect(service.escapeSearchValue('a,b$c|d\\e', 'string')).toBe('a\\,b\\$c\\|d\\\\e');
    // '|' separates system|code of a token, and url|version of a canonical.
    expect(service.escapeSearchValue('http://loinc.org|8867-4', 'token')).toBe('http://loinc.org|8867-4');
    expect(service.escapeSearchValue('http://x.org/vs|1.0,a', 'uri')).toBe('http://x.org/vs|1.0\\,a');
    expect(service.escapeSearchValue('Smith John')).toBe('Smith John');
  });

  it('should pass the search field type to the escaping of a Questionnaire search', (done) => {
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .and.returnValue(Promise.resolve({resourceType: 'Bundle', type: 'searchset'}));

    service.search('http://loinc.org|8867-4', 'questionnaire-code', {}, 'token').subscribe({next: () => {
      const url = reqSpy.calls.mostRecent().args[0]['url'] as string;
      expect(new URL(url, 'http://example.org/fhir/').searchParams.get('questionnaire-code'))
        .toBe('http://loinc.org|8867-4');
      done();
    }, error: done.fail});
  });

  it('should emit, not throw, an error for an invalid resource type', () => {
    const reqSpy = spyOn(service.getSmartClient(), 'request');
    const errors: string[] = [];

    expect(() => {
      service.searchResources('bad/type', 'x').subscribe({error: (error) => errors.push(error.message)});
      service.readResource('', 'id').subscribe({error: (error) => errors.push(error.message)});
    }).not.toThrow();

    expect(errors).toEqual(['Invalid FHIR resource type: bad/type', 'Invalid FHIR resource type: (empty)']);
    expect(reqSpy).not.toHaveBeenCalled();
  });

  it('should parse and cache resource capabilities for the selected server', (done) => {
    const statement = {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: '2026-09-02',
      kind: 'instance',
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [{
        mode: 'server',
        resource: [
          {type: 'Practitioner', searchParam: [{name: 'name', type: 'string'}]},
          {type: 'Patient', searchParam: [{name: 'name', type: 'string'}]}
        ]
      }]
    } as fhir.CapabilityStatement;
    const reqSpy = spyOn(service.getSmartClient(), 'request')
      .withArgs({url: 'metadata?_format=application/fhir+json'})
      .and.returnValue(Promise.resolve(statement));

    service.getResourceCapabilities().subscribe({next: (first) => {
      expect(first.map((capability) => capability.resourceType)).toEqual(['Patient', 'Practitioner']);
      expect(first[0].searchParameters[0].name).toBe('name');
      service.getResourceCapabilities().subscribe({next: (second) => {
        expect(second).toEqual(first);
        expect(reqSpy).toHaveBeenCalledTimes(1);
        done();
      }, error: done.fail});
    }, error: done.fail});
  });

  it('should add server-wide search parameters to every resource type', (done) => {
    const statement = {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: '2026-10-19',
      kind: 'instance',
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [{
        mode: 'server',
        searchParam: [{name: '_content', type: 'string'}, {name: '_id', type: 'token'}],
        resource: [
          {type: 'Patient', searchParam: [{name: 'name', type: 'string'}, {name: '_id', type: 'token'}]},
          {type: 'Practitioner'}
        ]
      }]
    } as fhir.CapabilityStatement;
    spyOn(service.getSmartClient(), 'request').and.returnValue(Promise.resolve(statement));

    service.getResourceCapabilities().subscribe({next: (capabilities) => {
      const namesByType = Object.fromEntries(capabilities.map((capability) =>
        [capability.resourceType, capability.searchParameters.map((parameter) => parameter.name)]
      ));
      expect(namesByType).toEqual({
        Patient: ['name', '_id', '_content'],
        Practitioner: ['_content', '_id']
      });
      done();
    }, error: done.fail});
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

  describe('isValidMimeType()', () => {
    it('should accept real IANA-registered MIME types', () => {
      [
        'text/plain',
        'application/json',
        'application/fhir+json',
        'image/png',
        'image/jpeg',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'audio/mpeg',
        'video/mp4',
        'message/rfc822',
        'font/woff2',
        'model/gltf+json',
        'TEXT/PLAIN' // case-insensitive
      ].forEach((mimeType) => {
        expect(service.isValidMimeType(mimeType)).withContext(mimeType).toBe(true);
      });
    });

    it('should accept registered MIME types with parameters and surrounding whitespace', () => {
      expect(service.isValidMimeType('text/plain; charset=utf-8')).toBe(true);
      expect(service.isValidMimeType('text/plain;charset=UTF-8')).toBe(true);
      expect(service.isValidMimeType('multipart/form-data; boundary=something')).toBe(true);
      expect(service.isValidMimeType('  application/xml  ')).toBe(true);
      expect(service.isValidMimeType('application/x-www-form-urlencoded')).toBe(true);
      expect(service.isValidMimeType('text/plain; charset="utf-8"')).toBe(true);        // quoted value
      expect(service.isValidMimeType('text/plain; charset="a;b"')).toBe(true);          // ';' inside quotes
      expect(service.isValidMimeType('multipart/mixed; boundary=abc; charset=utf-8')).toBe(true); // multiple params
    });

    it('should reject well-formed but unregistered (non-IANA) types', () => {
      [
        'text/xxxx',
        'application/xxxx',
        'image/notarealsubtype',
        'text/x-madeup',
        'foo/bar'
      ].forEach((value) => {
        expect(service.isValidMimeType(value)).withContext(value).toBe(false);
      });
    });

    it('should reject malformed values', () => {
      [
        '',
        '   ',
        'plaintext',
        'text',
        'text/',
        '/plain',
        'text//plain',
        'text plain',
        null,
        undefined,
        123 as any
      ].forEach((value) => {
        expect(service.isValidMimeType(value as any)).withContext(`${value}`).toBe(false);
      });
    });

    it('should reject a registered essence carrying a malformed parameter portion', () => {
      // The essence (text/plain, application/json) is IANA-registered, but per RFC 7231 a
      // parameter must be `token "=" ( token / quoted-string )`, so these are not legal MIME types.
      [
        'text/plain; blahblah',      // bare word - parameters require name=value
        'text/plain; charset',       // missing '=value'
        'application/json; a=b; c',  // trailing bare word
        'text/plain;',               // trailing ';' with no parameter
        'text/plain; =utf-8',        // missing parameter name
        'text/plain; charset=;'      // missing parameter value
      ].forEach((value) => {
        expect(service.isValidMimeType(value)).withContext(value).toBe(false);
      });
    });
  });
});
