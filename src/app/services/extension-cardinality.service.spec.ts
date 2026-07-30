import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {EXTENSION_URL_ENTRY_FORMAT} from '../lib/constants/constants';
import {ExtensionCardinalityService} from './extension-cardinality.service';
import {FhirService} from './fhir.service';

describe('ExtensionCardinalityService', () => {
  const defaultServerEndpoint = 'https://example.org/fhir';
  let service: ExtensionCardinalityService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ExtensionCardinalityService,
        {
          provide: FhirService,
          useValue: {
            getDefaultFhirServer: () => ({endpoint: defaultServerEndpoint, version: 'R5'})
          }
        }
      ]
    });
    service = TestBed.inject(ExtensionCardinalityService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return locally known cardinality without querying the FHIR server', () => {
    let result;
    service.resolveMaxCardinality(EXTENSION_URL_ENTRY_FORMAT)
      .subscribe((cardinality) => result = cardinality);

    expect(result).toBe('1');
    httpTestingController.expectNone(() => true);
  });

  it('should query and cache an unknown extension cardinality', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/custom-extension';
    const results = [];

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));
    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));

    const request = httpTestingController.expectOne((req) =>
      req.url === `${defaultServerEndpoint}/StructureDefinition`
      && req.params.get('url') === extensionUrl);
    expect(request.request.params.get('_count')).toBe('2');
    request.flush({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{
        resource: {
          resourceType: 'StructureDefinition',
          url: extensionUrl,
          snapshot: {
            element: [{id: 'Extension', path: 'Extension', max: '1'}]
          }
        }
      }]
    });

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));
    expect(results).toEqual(['1', '1', '1']);
    httpTestingController.expectNone(() => true);
  });

  it('should preserve a finite maximum greater than one', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/twice-only-extension';
    let result;
    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => result = cardinality);

    const request = httpTestingController.expectOne((req) =>
      req.url === `${defaultServerEndpoint}/StructureDefinition`);
    request.flush({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{
        resource: {
          resourceType: 'StructureDefinition',
          url: extensionUrl,
          differential: {
            element: [{id: 'Extension', path: 'Extension', max: '2'}]
          }
        }
      }]
    });

    expect(result).toBe('2');
  });

  it('should cache an unknown result when no matching definition is returned', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/missing-extension';
    const results = [];
    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));

    const request = httpTestingController.expectOne((req) =>
      req.url === `${defaultServerEndpoint}/StructureDefinition`);
    request.flush({resourceType: 'Bundle', type: 'searchset', entry: []});

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));
    expect(results).toEqual(['unknown', 'unknown']);
    httpTestingController.expectNone(() => true);
  });

  it('should remain permissive when the FHIR server lookup fails', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/unavailable-extension';
    let result;
    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => result = cardinality);

    const request = httpTestingController.expectOne((req) =>
      req.url === `${defaultServerEndpoint}/StructureDefinition`);
    request.flush('Server unavailable', {status: 503, statusText: 'Service Unavailable'});

    expect(result).toBe('unknown');
  });

  it('should not query the FHIR server for a relative child extension URL', () => {
    let result;
    service.resolveMaxCardinality('child-slice').subscribe((cardinality) => result = cardinality);

    expect(result).toBe('unknown');
    httpTestingController.expectNone(() => true);
  });
});
