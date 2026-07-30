import {TestBed} from '@angular/core/testing';
import {of, Subject, throwError} from 'rxjs';
import fhir from 'fhir/r4';
import {EXTENSION_URL_ENTRY_FORMAT} from '../lib/constants/constants';
import {ExtensionCardinalityService} from './extension-cardinality.service';
import {FhirService, FHIRServer} from './fhir.service';

describe('ExtensionCardinalityService', () => {
  const selectedServerEndpoint = 'https://example.org/fhir';
  let service: ExtensionCardinalityService;
  let fhirService: jasmine.SpyObj<FhirService>;
  let selectedServer: FHIRServer;

  beforeEach(() => {
    selectedServer = {
      endpoint: selectedServerEndpoint,
      version: 'R5'
    };
    fhirService = jasmine.createSpyObj<FhirService>(
      'FhirService',
      ['getFhirServer', 'getBundleByUrl']
    );
    fhirService.getFhirServer.and.callFake(() => selectedServer);

    TestBed.configureTestingModule({
      providers: [
        ExtensionCardinalityService,
        {provide: FhirService, useValue: fhirService}
      ]
    });
    service = TestBed.inject(ExtensionCardinalityService);
  });

  function expectedQuery(extensionUrl: string): string {
    return 'StructureDefinition?'
      + `url=${encodeURIComponent(extensionUrl)}`
      + '&_count=2'
      + `&_format=${encodeURIComponent('application/fhir+json')}`;
  }

  it('should return locally known cardinality without querying the FHIR server', () => {
    let result;
    service.resolveMaxCardinality(EXTENSION_URL_ENTRY_FORMAT)
      .subscribe((cardinality) => result = cardinality);

    expect(result).toBe('1');
    expect(fhirService.getBundleByUrl).not.toHaveBeenCalled();
  });

  it('should query the selected FHIR client and cache an unknown extension cardinality', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/custom-extension';
    const response = new Subject<fhir.Bundle>();
    const results = [];
    fhirService.getBundleByUrl.and.returnValue(response);

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));
    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));

    expect(fhirService.getFhirServer).toHaveBeenCalled();
    expect(fhirService.getBundleByUrl).toHaveBeenCalledOnceWith(expectedQuery(extensionUrl));
    response.next({
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
    } as fhir.Bundle);
    response.complete();

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));
    expect(results).toEqual(['1', '1', '1']);
    expect(fhirService.getBundleByUrl).toHaveBeenCalledTimes(1);
  });

  it('should preserve a finite maximum greater than one', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/twice-only-extension';
    let result;
    fhirService.getBundleByUrl.and.returnValue(of({
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
    } as fhir.Bundle));

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => result = cardinality);

    expect(result).toBe('2');
  });

  it('should use a separately cached lookup after import or export selects another server', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-specific-extension';
    const results = [];
    fhirService.getBundleByUrl.and.returnValues(
      of({resourceType: 'Bundle', type: 'searchset', entry: []}),
      of({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{
          resource: {
            resourceType: 'StructureDefinition',
            url: extensionUrl,
            snapshot: {element: [{path: 'Extension', max: '1'}]}
          }
        }]
      } as fhir.Bundle)
    );

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));
    selectedServer = {
      endpoint: 'https://another.example.org/fhir',
      version: 'R4'
    };
    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));

    expect(results).toEqual(['unknown', '1']);
    expect(fhirService.getBundleByUrl).toHaveBeenCalledTimes(2);
  });

  it('should cache an unknown result when no matching definition is returned', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/missing-extension';
    const results = [];
    fhirService.getBundleByUrl.and.returnValue(
      of({resourceType: 'Bundle', type: 'searchset', entry: []})
    );

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));
    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));

    expect(results).toEqual(['unknown', 'unknown']);
    expect(fhirService.getBundleByUrl).toHaveBeenCalledTimes(1);
  });

  it('should remain permissive when the FHIR server lookup fails', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/unavailable-extension';
    let result;
    fhirService.getBundleByUrl.and.returnValue(
      throwError(() => new Error('Server unavailable'))
    );

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => result = cardinality);

    expect(result).toBe('unknown');
  });

  it('should not query the FHIR server for a relative child extension URL', () => {
    let result;
    service.resolveMaxCardinality('child-slice').subscribe((cardinality) => result = cardinality);

    expect(result).toBe('unknown');
    expect(fhirService.getBundleByUrl).not.toHaveBeenCalled();
  });
});
