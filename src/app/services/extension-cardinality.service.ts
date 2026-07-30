import {inject, Injectable} from '@angular/core';
import {Observable, of, timeout} from 'rxjs';
import {catchError, map, shareReplay} from 'rxjs/operators';
import fhir from 'fhir/r4';
import {
  ExtensionMaxCardinality,
  getExtensionMaxCardinality
} from '../lib/extension-defs';
import {FhirService} from './fhir.service';

const CARDINALITY_LOOKUP_TIMEOUT_MS = 5000;

/**
 * Resolves extension root cardinalities from local metadata and, when needed,
 * the FHIR server currently selected for import and export.
 */
@Injectable({
  providedIn: 'root'
})
export class ExtensionCardinalityService {
  private readonly fhirService = inject(FhirService);
  private readonly lookupCache = new Map<string, Observable<ExtensionMaxCardinality>>();

  /**
   * Resolve an extension's maximum cardinality.
   *
   * Locally bundled metadata always takes precedence. Unknown absolute
   * canonical URLs are looked up once per selected server and cached, including
   * not-found and failed lookups.
   */
  resolveMaxCardinality(url: string): Observable<ExtensionMaxCardinality> {
    const normalizedUrl = url?.trim();
    const localCardinality = getExtensionMaxCardinality(normalizedUrl);
    if (localCardinality !== 'unknown' || !this.isAbsoluteCanonical(normalizedUrl)) {
      return of(localCardinality);
    }

    const serverEndpoint = this.fhirService.getFhirServer().endpoint.replace(/\/$/, '');
    const cacheKey = `${serverEndpoint}|${normalizedUrl}`;
    let lookup = this.lookupCache.get(cacheKey);
    if (!lookup) {
      const query = 'StructureDefinition?'
        + `url=${encodeURIComponent(normalizedUrl)}`
        + '&_count=2'
        + `&_format=${encodeURIComponent('application/fhir+json')}`;
      lookup = this.fhirService.getBundleByUrl(query).pipe(
        timeout(CARDINALITY_LOOKUP_TIMEOUT_MS),
        map((bundle) => this.getCardinalityFromBundle(bundle, normalizedUrl)),
        catchError(() => of<ExtensionMaxCardinality>('unknown')),
        shareReplay({bufferSize: 1, refCount: false})
      );
      this.lookupCache.set(cacheKey, lookup);
    }

    return lookup;
  }

  private isAbsoluteCanonical(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  private getCardinalityFromBundle(bundle: fhir.Bundle, canonicalUrl: string): ExtensionMaxCardinality {
    const definition = bundle?.entry
      ?.map((entry) => entry.resource)
      .find((resource): resource is fhir.StructureDefinition =>
        resource?.resourceType === 'StructureDefinition' && resource.url === canonicalUrl);
    const rootElement = definition?.snapshot?.element?.find((element) => element.path === 'Extension')
      ?? definition?.differential?.element?.find((element) => element.path === 'Extension');
    const max = rootElement?.max;

    if (max === '*') {
      return '*';
    }
    if (/^\d+$/.test(max)) {
      return max as `${number}`;
    }
    return 'unknown';
  }
}
