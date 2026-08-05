import {inject, Injectable} from '@angular/core';
import {Observable, of, Subject, timeout} from 'rxjs';
import {catchError, map, shareReplay, switchMap} from 'rxjs/operators';
import fhir from 'fhir/r4';
import {
  ExtensionMaxCardinality,
  getExtensionMaxCardinality,
  KnownExtensionMaxCardinality
} from '../lib/extension-defs';
import {FhirService} from './fhir.service';

const CARDINALITY_LOOKUP_TIMEOUT_MS = 5000;

export interface ExtensionCardinalityCandidate {
  id?: string;
  version?: string;
  fhirVersion?: string;
  title?: string;
  status?: string;
  date?: string;
  publisher?: string;
  maxCardinality: ExtensionMaxCardinality;
}

export type ExtensionCardinalityResolution =
  | {status: 'resolved'; maxCardinality: KnownExtensionMaxCardinality}
  | {status: 'unknown'}
  | {status: 'unverified'}
  | {status: 'ambiguous'; candidates: ExtensionCardinalityCandidate[]};

/**
 * Resolves extension root cardinalities from local metadata and, when needed,
 * the FHIR server currently selected for import and export.
 */
@Injectable({
  providedIn: 'root'
})
export class ExtensionCardinalityService {
  private readonly fhirService = inject(FhirService);
  private readonly lookupCache = new Map<string, Observable<ExtensionCardinalityResolution>>();
  private readonly selectionCache = new Map<string, ExtensionMaxCardinality | 'unverified'>();
  private readonly pendingSelectionChanges = new Map<string, Subject<void>>();
  private readonly selectionGenerationChanges = new Subject<number>();
  readonly selectionGenerationChanges$ = this.selectionGenerationChanges.asObservable();
  private selectionGeneration = 0;

  /**
   * Resolve an extension's maximum cardinality.
   *
   * Ambiguous server results remain unknown for callers that do not support
   * selecting a specific StructureDefinition.
   * @param url - Canonical extension URL to resolve.
   * @returns Observable containing the resolved maximum or "unknown".
   */
  resolveMaxCardinality(url: string): Observable<ExtensionMaxCardinality> {
    return this.resolveCardinality(url).pipe(
      map((resolution) =>
        resolution.status === 'resolved' ? resolution.maxCardinality : 'unknown')
    );
  }

  /**
   * Resolve cardinality while preserving conflicting StructureDefinition
   * versions so the caller can ask the user which definition applies.
   *
   * Locally bundled metadata always takes precedence. Unknown absolute
   * canonical URLs are looked up once per selected server and cached, including
   * not-found and failed lookups.
   * @param url - Canonical extension URL to resolve.
   * @returns Observable containing a resolved, unknown, unverified, or ambiguous result.
   */
  resolveCardinality(url: string): Observable<ExtensionCardinalityResolution> {
    const normalizedUrl = url?.trim();
    const localCardinality = getExtensionMaxCardinality(normalizedUrl);
    if (localCardinality !== 'unknown') {
      return of({status: 'resolved', maxCardinality: localCardinality});
    }
    if (!this.isAbsoluteCanonical(normalizedUrl)) {
      return of({status: 'unknown'});
    }

    const serverEndpoint = this.getCurrentServerEndpoint();
    const cacheKey = this.getCacheKey(serverEndpoint, normalizedUrl);
    const selectedCardinality = this.selectionCache.get(cacheKey);
    if (selectedCardinality) {
      if (selectedCardinality === 'unverified') {
        return of({status: 'unverified'});
      }
      return selectedCardinality === 'unknown'
        ? of({status: 'unknown'})
        : of({status: 'resolved', maxCardinality: selectedCardinality});
    }

    let lookup = this.lookupCache.get(cacheKey);
    if (!lookup) {
      const query = 'StructureDefinition?'
        + `url=${encodeURIComponent(normalizedUrl)}`
        + '&_count=100'
        + `&_format=${encodeURIComponent('application/fhir+json')}`;
      lookup = this.getMatchingDefinitions(query, normalizedUrl).pipe(
        map((definitions) => this.resolveDefinitions(definitions)),
        catchError(() => of<ExtensionCardinalityResolution>({status: 'unknown'})),
        shareReplay({bufferSize: 1, refCount: false})
      );
      this.lookupCache.set(cacheKey, lookup);
    }

    return lookup;
  }

  /**
   * Remember a user's choice for the currently selected server and canonical URL.
   * @param url - Canonical extension URL associated with the choice.
   * @param candidate - StructureDefinition candidate selected by the user.
   * @param selectionGeneration - Questionnaire generation that opened the selection dialog.
   * @param serverEndpoint - FHIR server endpoint that returned the candidate.
   */
  rememberSelection(
    url: string,
    candidate: ExtensionCardinalityCandidate,
    selectionGeneration = this.selectionGeneration,
    serverEndpoint = this.getCurrentServerEndpoint()
  ): void {
    if (selectionGeneration !== this.selectionGeneration) {
      return;
    }
    this.rememberCardinality(url, candidate.maxCardinality, serverEndpoint);
  }

  /**
   * Remember that the user chose to continue without verifying cardinality.
   * @param url - Canonical extension URL whose cardinality remains unknown.
   * @param selectionGeneration - Questionnaire generation that opened the selection dialog.
   * @param serverEndpoint - FHIR server endpoint used for the lookup.
   */
  rememberUnverified(
    url: string,
    selectionGeneration = this.selectionGeneration,
    serverEndpoint = this.getCurrentServerEndpoint()
  ): void {
    if (selectionGeneration !== this.selectionGeneration) {
      return;
    }
    const normalizedUrl = url?.trim();
    this.selectionCache.set(
      this.getCacheKey(serverEndpoint, normalizedUrl),
      'unverified'
    );
  }

  /**
   * Clear user decisions when a different Questionnaire is loaded.
   * Server lookup results remain cached because they are not Questionnaire-specific.
   */
  clearSelections(): void {
    this.selectionGeneration++;
    this.selectionCache.clear();
    this.pendingSelectionChanges.forEach((selectionChange) => selectionChange.complete());
    this.pendingSelectionChanges.clear();
    this.selectionGenerationChanges.next(this.selectionGeneration);
  }

  /**
   * Get the generation associated with the currently loaded Questionnaire.
   * @returns Current Questionnaire selection generation.
   */
  getSelectionGeneration(): number {
    return this.selectionGeneration;
  }

  /**
   * Get the normalized endpoint of the FHIR server currently selected for import and export.
   * @returns Current FHIR server endpoint without a trailing slash.
   */
  getCurrentServerEndpoint(): string {
    return this.fhirService.getFhirServer().endpoint.replace(/\/$/, '');
  }

  /**
   * Claim ownership of the definition-selection dialog for one resolution context.
   * @param url - Canonical extension URL requiring a user selection.
   * @param selectionGeneration - Questionnaire generation that initiated the lookup.
   * @param serverEndpoint - FHIR server endpoint that returned the candidates.
   * @returns True when the caller should open the selection dialog.
   */
  tryBeginSelection(
    url: string,
    selectionGeneration: number,
    serverEndpoint: string
  ): boolean {
    if (selectionGeneration !== this.selectionGeneration) {
      return false;
    }
    const selectionKey = this.getPendingSelectionKey(url, selectionGeneration, serverEndpoint);
    if (this.pendingSelectionChanges.has(selectionKey)) {
      return false;
    }
    this.pendingSelectionChanges.set(selectionKey, new Subject<void>());
    return true;
  }

  /**
   * Observe completion or release of another dialog selecting the same definition.
   * @param url - Canonical extension URL awaiting a user selection.
   * @param selectionGeneration - Questionnaire generation that initiated the lookup.
   * @param serverEndpoint - FHIR server endpoint that returned the candidates.
   * @returns Observable that emits when the waiting editor should revalidate.
   */
  waitForSelection(
    url: string,
    selectionGeneration: number,
    serverEndpoint: string
  ): Observable<void> {
    const selectionKey = this.getPendingSelectionKey(url, selectionGeneration, serverEndpoint);
    return this.pendingSelectionChanges.get(selectionKey)?.asObservable() ?? of(undefined);
  }

  /**
   * Release ownership and notify editors waiting for the same definition selection.
   * @param url - Canonical extension URL whose selection dialog completed or closed.
   * @param selectionGeneration - Questionnaire generation that initiated the lookup.
   * @param serverEndpoint - FHIR server endpoint that returned the candidates.
   */
  endSelection(url: string, selectionGeneration: number, serverEndpoint: string): void {
    const selectionKey = this.getPendingSelectionKey(url, selectionGeneration, serverEndpoint);
    const selectionChange = this.pendingSelectionChanges.get(selectionKey);
    if (!selectionChange) {
      return;
    }
    this.pendingSelectionChanges.delete(selectionKey);
    selectionChange.next();
    selectionChange.complete();
  }

  /**
   * Cache a cardinality decision for the selected server and canonical URL.
   * @param url - Canonical extension URL associated with the decision.
   * @param cardinality - Maximum cardinality to cache.
   * @param serverEndpoint - FHIR server endpoint that supplied the decision.
   */
  private rememberCardinality(
    url: string,
    cardinality: ExtensionMaxCardinality,
    serverEndpoint: string
  ): void {
    const normalizedUrl = url?.trim();
    this.selectionCache.set(
      this.getCacheKey(serverEndpoint, normalizedUrl),
      cardinality
    );
  }

  /**
   * Determine whether a URL is an absolute HTTP or HTTPS canonical URL.
   * @param url - URL to inspect.
   * @returns True when the URL is an absolute HTTP or HTTPS URL.
   */
  private isAbsoluteCanonical(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  /**
   * Build a cache key scoped to a FHIR server and canonical URL.
   * @param serverEndpoint - Base endpoint of the selected FHIR server.
   * @param canonicalUrl - Canonical extension URL.
   * @returns Stable cache key for the server and URL pair.
   */
  private getCacheKey(serverEndpoint: string, canonicalUrl: string): string {
    return `${serverEndpoint}|${canonicalUrl}`;
  }

  /**
   * Build a key for an outstanding user selection within one Questionnaire.
   * @param url - Canonical extension URL requiring a selection.
   * @param selectionGeneration - Questionnaire generation that initiated the lookup.
   * @param serverEndpoint - FHIR server endpoint that returned the candidates.
   * @returns Stable key for coordinating one selection dialog.
   */
  private getPendingSelectionKey(
    url: string,
    selectionGeneration: number,
    serverEndpoint: string
  ): string {
    return `${selectionGeneration}|${this.getCacheKey(serverEndpoint, url?.trim())}`;
  }

  /**
   * Retrieve matching StructureDefinitions from the current page and all subsequent pages.
   * @param requestUrl - Relative or absolute FHIR search URL to request.
   * @param canonicalUrl - Canonical URL used to filter returned resources.
   * @returns Observable containing every matching StructureDefinition.
   */
  private getMatchingDefinitions(
    requestUrl: string,
    canonicalUrl: string
  ): Observable<fhir.StructureDefinition[]> {
    return this.fhirService.getBundleByUrl(requestUrl).pipe(
      timeout(CARDINALITY_LOOKUP_TIMEOUT_MS),
      switchMap((bundle) => {
        const definitions = bundle?.entry
          ?.map((entry) => entry.resource)
          .filter((resource): resource is fhir.StructureDefinition =>
            resource?.resourceType === 'StructureDefinition' && resource.url === canonicalUrl)
          ?? [];
        const nextUrl = bundle?.link?.find((link) => link.relation === 'next')?.url;
        if (!nextUrl) {
          return of(definitions);
        }

        return this.getMatchingDefinitions(nextUrl, canonicalUrl).pipe(
          map((nextDefinitions) => [...definitions, ...nextDefinitions])
        );
      })
    );
  }

  /**
   * Resolve a set of matching StructureDefinitions by comparing their maxima.
   * @param definitions - Matching StructureDefinitions returned by the FHIR server.
   * @returns Resolved cardinality, unknown state, or candidates requiring user selection.
   */
  private resolveDefinitions(
    definitions: fhir.StructureDefinition[]
  ): ExtensionCardinalityResolution {
    const candidates = definitions.map((definition) => this.toCandidate(definition));
    if (candidates.length === 0) {
      return {status: 'unknown'};
    }

    const maxima = new Set(candidates.map((candidate) => candidate.maxCardinality));
    if (maxima.size === 1) {
      const maxCardinality = candidates[0].maxCardinality;
      return maxCardinality === 'unknown'
        ? {status: 'unknown'}
        : {status: 'resolved', maxCardinality};
    }

    return {status: 'ambiguous', candidates};
  }

  /**
   * Convert a StructureDefinition into display and cardinality metadata.
   * @param definition - StructureDefinition to convert.
   * @returns Candidate metadata for the selection dialog.
   */
  private toCandidate(definition: fhir.StructureDefinition): ExtensionCardinalityCandidate {
    return {
      id: definition.id,
      version: definition.version,
      fhirVersion: definition.fhirVersion,
      title: definition.title,
      status: definition.status,
      date: definition.date,
      publisher: definition.publisher,
      maxCardinality: this.getCardinalityFromDefinition(definition)
    };
  }

  /**
   * Read the root Extension maximum from a StructureDefinition.
   * @param definition - StructureDefinition containing snapshot or differential elements.
   * @returns Root maximum cardinality, or "unknown" when it cannot be determined.
   */
  private getCardinalityFromDefinition(
    definition: fhir.StructureDefinition
  ): ExtensionMaxCardinality {
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
