import {TestBed} from '@angular/core/testing';
import {of, Subject, throwError} from 'rxjs';
import fhir from 'fhir/r4';
import {EXTENSION_URL_ENTRY_FORMAT} from '../lib/constants/constants';
import {
  ExtensionCardinalityResolution,
  ExtensionCardinalityService
} from './extension-cardinality.service';
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

  /**
   * Build the expected StructureDefinition search URL for a canonical extension.
   * @param extensionUrl - Canonical extension URL included in the search.
   * @returns Expected relative FHIR search URL.
   */
  function expectedQuery(extensionUrl: string): string {
    return 'StructureDefinition?'
      + `url=${encodeURIComponent(extensionUrl)}`
      + '&_count=100'
      + `&_format=${encodeURIComponent('application/fhir+json')}`;
  }

  /**
   * Build a compact FHIR search bundle for service tests.
   * @param resources - Resources to include as bundle entries.
   * @param link - Optional pagination links.
   * @returns FHIR searchset bundle containing the supplied resources.
   */
  function bundle(
    resources: any[] = [],
    link?: fhir.BundleLink[]
  ): fhir.Bundle {
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: resources.map((resource) => ({resource})),
      link
    } as fhir.Bundle;
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
    response.next(bundle([{
      resourceType: 'StructureDefinition',
      url: extensionUrl,
      snapshot: {
        element: [{id: 'Extension', path: 'Extension', max: '1'}]
      }
    }]));
    response.complete();

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => results.push(cardinality));
    expect(results).toEqual(['1', '1', '1']);
    expect(fhirService.getBundleByUrl).toHaveBeenCalledTimes(1);
  });

  it('should preserve a finite maximum greater than one', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/twice-only-extension';
    let result;
    fhirService.getBundleByUrl.and.returnValue(of(bundle([{
      resourceType: 'StructureDefinition',
      url: extensionUrl,
      differential: {
        element: [{id: 'Extension', path: 'Extension', max: '2'}]
      }
    }])));

    service.resolveMaxCardinality(extensionUrl).subscribe((cardinality) => result = cardinality);

    expect(result).toBe('2');
  });

  it('should resolve multiple versions automatically when their maxima agree', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/agreed-extension';
    let result: ExtensionCardinalityResolution;
    fhirService.getBundleByUrl.and.returnValue(of(bundle([{
      resourceType: 'StructureDefinition',
      url: extensionUrl,
      version: '1.0.0',
      snapshot: {element: [{path: 'Extension', max: '1'}]}
    }, {
      resourceType: 'StructureDefinition',
      url: extensionUrl,
      version: '2.0.0',
      snapshot: {element: [{path: 'Extension', max: '1'}]}
    }])));

    service.resolveCardinality(extensionUrl).subscribe((resolution) => result = resolution);

    expect(result).toEqual({status: 'resolved', maxCardinality: '1'});
  });

  it('should return conflicting versions for user selection and cache the choice', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/conflicting-extension';
    let result: ExtensionCardinalityResolution;
    fhirService.getBundleByUrl.and.returnValue(of(bundle([{
      resourceType: 'StructureDefinition',
      id: 'extension-v1',
      url: extensionUrl,
      version: '1.0.0',
      fhirVersion: '4.0.1',
      snapshot: {element: [{path: 'Extension', max: '1'}]}
    }, {
      resourceType: 'StructureDefinition',
      id: 'extension-v2',
      url: extensionUrl,
      version: '2.0.0',
      fhirVersion: '5.0.0',
      snapshot: {element: [{path: 'Extension', max: '*'}]}
    }])));

    service.resolveCardinality(extensionUrl).subscribe((resolution) => result = resolution);

    expect(result.status).toBe('ambiguous');
    if (result.status !== 'ambiguous') {
      fail('Expected ambiguous cardinality results');
      return;
    }
    expect(result.candidates).toEqual([
      jasmine.objectContaining({
        id: 'extension-v1',
        version: '1.0.0',
        fhirVersion: '4.0.1',
        maxCardinality: '1'
      }),
      jasmine.objectContaining({
        id: 'extension-v2',
        version: '2.0.0',
        fhirVersion: '5.0.0',
        maxCardinality: '*'
      })
    ]);

    service.rememberSelection(extensionUrl, result.candidates[1]);
    let selectedResult: ExtensionCardinalityResolution;
    service.resolveCardinality(extensionUrl)
      .subscribe((resolution) => selectedResult = resolution);

    expect(selectedResult).toEqual({status: 'resolved', maxCardinality: '*'});
    expect(fhirService.getBundleByUrl).toHaveBeenCalledTimes(1);
  });

  it('should preserve an unverified selection separately from an unknown lookup', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/conflicting-extension';
    let result: ExtensionCardinalityResolution;

    service.rememberUnverified(extensionUrl);
    service.resolveCardinality(extensionUrl)
      .subscribe((resolution) => result = resolution);

    expect(result).toEqual({status: 'unverified'});
    expect(fhirService.getBundleByUrl).not.toHaveBeenCalled();
  });

  it('should clear user selections without discarding the server lookup', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/conflicting-extension';
    fhirService.getBundleByUrl.and.returnValue(of(bundle([{
      resourceType: 'StructureDefinition',
      url: extensionUrl,
      version: '1.0.0',
      snapshot: {element: [{path: 'Extension', max: '1'}]}
    }, {
      resourceType: 'StructureDefinition',
      url: extensionUrl,
      version: '2.0.0',
      snapshot: {element: [{path: 'Extension', max: '*'}]}
    }])));
    let initialResult: ExtensionCardinalityResolution;
    service.resolveCardinality(extensionUrl).subscribe((resolution) => initialResult = resolution);
    expect(initialResult.status).toBe('ambiguous');
    if (initialResult.status !== 'ambiguous') {
      fail('Expected ambiguous cardinality results');
      return;
    }
    service.rememberSelection(extensionUrl, initialResult.candidates[0]);

    service.clearSelections();

    let resultAfterClear: ExtensionCardinalityResolution;
    service.resolveCardinality(extensionUrl).subscribe((resolution) => resultAfterClear = resolution);
    expect(resultAfterClear.status).toBe('ambiguous');
    expect(fhirService.getBundleByUrl).toHaveBeenCalledTimes(1);
  });

  it('should ignore a verified selection completed for a previous Questionnaire', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/stale-selection';
    const previousGeneration = service.getSelectionGeneration();
    const candidate = {maxCardinality: '1'} as const;

    service.clearSelections();
    service.rememberSelection(extensionUrl, candidate, previousGeneration);
    fhirService.getBundleByUrl.and.returnValue(of(bundle()));

    let result: ExtensionCardinalityResolution;
    service.resolveCardinality(extensionUrl).subscribe((resolution) => result = resolution);

    expect(result).toEqual({status: 'unknown'});
    expect(fhirService.getBundleByUrl).toHaveBeenCalledOnceWith(expectedQuery(extensionUrl));
  });

  it('should ignore an unverified selection completed for a previous Questionnaire', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/stale-unverified-selection';
    const previousGeneration = service.getSelectionGeneration();

    service.clearSelections();
    service.rememberUnverified(extensionUrl, previousGeneration);
    fhirService.getBundleByUrl.and.returnValue(of(bundle()));

    let result: ExtensionCardinalityResolution;
    service.resolveCardinality(extensionUrl).subscribe((resolution) => result = resolution);

    expect(result).toEqual({status: 'unknown'});
    expect(fhirService.getBundleByUrl).toHaveBeenCalledOnceWith(expectedQuery(extensionUrl));
  });

  it('should follow search pagination before deciding whether results conflict', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/paged-extension';
    const nextUrl = `${selectedServerEndpoint}/StructureDefinition?url=paged-extension&page=2`;
    let result: ExtensionCardinalityResolution;
    fhirService.getBundleByUrl.and.returnValues(
      of(bundle([{
        resourceType: 'StructureDefinition',
        url: extensionUrl,
        version: '1.0.0',
        snapshot: {element: [{path: 'Extension', max: '1'}]}
      }], [{relation: 'next', url: nextUrl}])),
      of(bundle([{
        resourceType: 'StructureDefinition',
        url: extensionUrl,
        version: '2.0.0',
        snapshot: {element: [{path: 'Extension', max: '*'}]}
      }]))
    );

    service.resolveCardinality(extensionUrl).subscribe((resolution) => result = resolution);

    expect(fhirService.getBundleByUrl).toHaveBeenCalledWith(expectedQuery(extensionUrl));
    expect(fhirService.getBundleByUrl).toHaveBeenCalledWith(nextUrl);
    expect(result.status).toBe('ambiguous');
    if (result.status === 'ambiguous') {
      expect(result.candidates.length).toBe(2);
    }
  });

  it('should use a separately cached lookup after import or export selects another server', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/server-specific-extension';
    const results = [];
    fhirService.getBundleByUrl.and.returnValues(
      of(bundle()),
      of(bundle([{
        resourceType: 'StructureDefinition',
        url: extensionUrl,
        snapshot: {element: [{path: 'Extension', max: '1'}]}
      }]))
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

  it('should cache a delayed selection against the server that returned it', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/delayed-server-selection';
    const originalServerEndpoint = service.getCurrentServerEndpoint();
    const selectionGeneration = service.getSelectionGeneration();
    const candidate = {maxCardinality: '1'} as const;

    selectedServer = {
      endpoint: 'https://another.example.org/fhir',
      version: 'R4'
    };
    service.rememberSelection(
      extensionUrl,
      candidate,
      selectionGeneration,
      originalServerEndpoint
    );
    fhirService.getBundleByUrl.and.returnValue(of(bundle()));

    let resultOnNewServer: ExtensionCardinalityResolution;
    service.resolveCardinality(extensionUrl)
      .subscribe((resolution) => resultOnNewServer = resolution);
    expect(resultOnNewServer).toEqual({status: 'unknown'});

    selectedServer = {
      endpoint: originalServerEndpoint,
      version: 'R5'
    };
    let resultOnOriginalServer: ExtensionCardinalityResolution;
    service.resolveCardinality(extensionUrl)
      .subscribe((resolution) => resultOnOriginalServer = resolution);
    expect(resultOnOriginalServer).toEqual({status: 'resolved', maxCardinality: '1'});
    expect(fhirService.getBundleByUrl).toHaveBeenCalledTimes(1);
  });

  it('should coordinate one outstanding selection per Questionnaire, server, and URL', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/coordinated-selection';
    const selectionGeneration = service.getSelectionGeneration();
    const serverEndpoint = service.getCurrentServerEndpoint();
    let notifications = 0;

    expect(service.tryBeginSelection(extensionUrl, selectionGeneration, serverEndpoint)).toBeTrue();
    expect(service.tryBeginSelection(extensionUrl, selectionGeneration, serverEndpoint)).toBeFalse();
    service.waitForSelection(extensionUrl, selectionGeneration, serverEndpoint)
      .subscribe(() => notifications++);

    service.endSelection(extensionUrl, selectionGeneration, serverEndpoint);

    expect(notifications).toBe(1);
    expect(service.tryBeginSelection(extensionUrl, selectionGeneration, serverEndpoint)).toBeTrue();
    service.endSelection(extensionUrl, selectionGeneration, serverEndpoint);
  });

  it('should cache an unknown result when no matching definition is returned', () => {
    const extensionUrl = 'http://example.org/StructureDefinition/missing-extension';
    const results = [];
    fhirService.getBundleByUrl.and.returnValue(of(bundle()));

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
