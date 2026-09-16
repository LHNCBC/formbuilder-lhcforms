import {Component, inject} from '@angular/core';
import {
  FhirService,
  FHIRResourceCapability,
  FHIRServer
} from '../../../services/fhir.service';
import {NgbActiveModal, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import fhir from 'fhir/r4';
import {fhirPrimitives} from '../../../fhir';
import {BehaviorSubject, Observable, ObservableInput, of, Subject} from 'rxjs';
import {catchError, finalize, map, switchMap, tap} from 'rxjs/operators';
import { faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import {FHIR_VERSION_TYPE} from "../../util";
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {getContainedResourceDisplay} from '../contained/contained-resource-display.util';
// Search related inputs on the page.
interface State {
  searchTerm: string;
  searchField: SearchField;
  fhirServer: FHIRServer;
  resourceType: string;
}

export interface SearchField {
  field: string,
  display: string,
  searchFieldPlaceholder: string
  supportedVersions?: FHIR_VERSION_TYPE []; // If not defined, assume all versions are supported.
}

export interface FhirResourceSelection {
  resourceType: string;
  id: string;
}

export type FhirSearchMode = 'questionnaire' | 'contained-resource';
@Component({
  selector: 'lfb-fhir-search-dlg',
  imports: [FormsModule, CommonModule, FontAwesomeModule, NgbTooltipModule],
  styles: [`
    .result-item:hover {
      background-color: lightgrey;
    }

    .bs-like-control {
      border-color: lightgrey;
      border-radius: .2rem;
      color: #495057;
      font-size: 0.875rem;
    }
  `
  ],
  templateUrl: 'fhir-search-dlg.component.html'
})
export class FhirSearchDlgComponent {
  private activeModal = inject(NgbActiveModal);


  infoIcon = faInfoCircle;
  private _loading$ = new BehaviorSubject<boolean>(false);
  private _search$ = new Subject<void>();
  private _bundle$ = new BehaviorSubject<fhir.Bundle>(null);

  inputTerm = '';
  resultsOffset = 0; // To calculate serial number of the results across pages
  pageSize = 20;
  nextUrl: fhirPrimitives.url = null;
  prevUrl: fhirPrimitives.url = null;
  total: number = undefined;
  resources: any [];
  questionnaires: fhir.Questionnaire [];
  searchError: {message?: string, details?: string[]};
  errorDetailsShow = false;
  mode: FhirSearchMode = 'questionnaire';
  resourceCapabilities: FHIRResourceCapability[] = [];
  resourceTypes: string[] = [];
  capabilityLoading = false;
  capabilityError = '';

  /**
   * Define a structure to associate fhir search field, its modifiers, display and search input field placeholder.
   */
  _searchFieldList: SearchField [] = [
    {field: '_content', display: 'Any text field', searchFieldPlaceholder: 'Search any text field'},
    {field: 'questionnaire-code', display: 'Questionnaire code', searchFieldPlaceholder: 'Search questionnaire code', supportedVersions: ['R5']},
    {field: 'code', display: 'Item code', searchFieldPlaceholder: 'Search item code', supportedVersions: ['STU3', 'R4']},
    {field: 'item-code', display: 'Item code', searchFieldPlaceholder: 'Search item code', supportedVersions: ['R5']},
    {field: 'title:contains', display: 'Form title only', searchFieldPlaceholder: 'Search form title'},
    {field: 'name:contains', display: 'Form name only', searchFieldPlaceholder: 'Search form name'}
  ];

  private readonly genericSearchFieldList: SearchField[] = [
    {field: '_content', display: 'Any text field', searchFieldPlaceholder: 'Search any text field'},
    {field: '_id', display: 'Resource ID', searchFieldPlaceholder: 'Search resource ID'}
  ];

  fhirService = inject(FhirService);
  /**
   * Define a structure to associate search parameters on the page.
   * @private
   */
  private _state: State = {
    searchTerm: '',
    searchField: this._searchFieldList[0],
    fhirServer: this.fhirService.getFhirServer(),
    resourceType: 'Questionnaire'
  };

  constructor() {
    // Set up search pipeline
    this._search$.pipe(
      tap(() => {
        this.searchError = null;
        this.errorDetailsShow = false;
        this._loading$.next(true);
      }),
      switchMap(() => this._search().pipe(
        catchError((error, caught): ObservableInput<any> => {
          const errorList = this.getOperationOutcomeIssues(error);

          this.searchError = {details: errorList.map(e => e.diagnostics).filter(Boolean)};
          if (error.statusCode < 500 && error.statusCode >= 400) {
            this.searchError.message = 'The search parameters may not be supported by the selected FHIR server.';
          }
          else if (error.statusCode >= 500) {
            this.searchError.message = 'Server error - the selected FHIR server encountered an internal error.';
          }
          else {
            this.searchError.message = `Error searching ${this.resourceType || 'FHIR'} resources.`;
          }
          console.error(this.searchError.message, error);
          return of(null);
        }),
        finalize(() => this._loading$.next(false))
      )),
    ).subscribe((bundle) => {
      this.total = undefined; // Reset total before processing bundle
      this._bundle$.next(bundle);
    });

    // Set up bundle pipeline. Bundle could be invoked either by search or navigation.
    this.bundle$.pipe(map((bundle) => {
      this.resources = null;
      this.questionnaires = null;
      this.nextUrl = null;
      this.prevUrl = null;

      if(!bundle) {
        return null; // Might happen when initializing _bundle$ or when error occurs.
      }
      if(bundle.total !== undefined) { // page bundles may not have total. The existing total is valid.
        this.total = bundle.total;
      }

      // Capture navigation urls.
      if(bundle.link && bundle.link && bundle.link.length > 0) {
        bundle.link.forEach((lnk) => {
          switch (lnk.relation) {
            case 'self':
              this.resultsOffset = this._getOffset(lnk.url);
              break;
            case 'next':
              this.nextUrl = lnk.url;
              break;
            case 'prev':
            case 'previous':
              this.prevUrl = lnk.url;
              break;
          }
        });
      }

      if(!bundle.entry) {
        return null;
      }
      return bundle.entry.flatMap((e) => {
        // Trim down resource
        const res = e.resource;
        if(!res || res.resourceType !== this.resourceType) {
          return [];
        }
        const ret = {};
        ['resourceType', 'id', 'title', 'name', 'publisher', 'date', 'status', 'code', 'description', 'meta', 'version'].forEach((f) => {
          if(res[f]) {
            ret[f] = res[f];
          }
        });
        return [ret as fhir.Resource];
      });
    })
    ).subscribe((resources: fhir.Resource []) => {
      this.resources = resources;
      this.questionnaires = this.mode === 'questionnaire'
        ? resources as fhir.Questionnaire[]
        : null;
    });
  }

  // Getters and setters
  get loading$() { return this._loading$.asObservable(); }
  get bundle$() { return this._bundle$.asObservable(); }
  get searchTerm() { return this._state.searchTerm; }
  set searchTerm(searchTerm: string) { this._set({searchTerm}); }
  get searchField() { return this._state.searchField; }
  set searchField(searchField: SearchField) { this._set({searchField});}
  get resourceType() { return this._state.resourceType; }
  set resourceType(resourceType: string) { this._set({resourceType}); }
  get selectedFHIRServer() {return this._state.fhirServer;}

  /**
   * Set the selected FHIR server and reset version- or capability-dependent search state.
   *
   * @param fhirServer - Selected FHIR server.
   */
  set selectedFHIRServer(fhirServer: FHIRServer) {
    if(!fhirServer) {
      return;
    }
    this.fhirService.setFhirServer(fhirServer);
    if(this.mode === 'contained-resource') {
      this._set({fhirServer});
      this.resetSearchState();
      this.loadResourceCapabilities();
      return;
    }
    // Make sure the search field is compatible with the selected FHIR server version.
    let searchField = this.searchField;
    if (searchField.supportedVersions && !searchField.supportedVersions.includes(fhirServer.version)) {
      // 'code' and 'item-code' are similar search fields in different FHIR versions. Try to find a suitalbe param.
      if (searchField.field === 'code' || searchField.field === 'item-code') {
        searchField = this._searchFieldList.find((sField) => {
          return sField.supportedVersions?.includes(fhirServer.version) && (sField.field === 'code' || sField.field === 'item-code');
        });
      }
      else if(searchField.field === 'questionnaire-code') {
        // Set the default for incompatible search field.
        searchField = this._searchFieldList[0];
      }
    }
    this._set({fhirServer, searchField});
  }

  /**
   * Get search fields appropriate to the current mode, server version, and resource type.
   *
   * @returns Search fields displayed in the search-field selector.
   */
  get searchFieldList(): SearchField [] {
    if(this.mode === 'contained-resource') {
      return this.getGenericSearchFields();
    }
    // Filter search fields based on selected FHIR server version.
    return this._searchFieldList.filter((searchField) => {
      // If supportedVersions is not defined, assume all versions are supported.
      return !searchField.supportedVersions || searchField.supportedVersions.includes(this.selectedFHIRServer.version);
    });
  }

  /**
   * Set partial properties of search state.
   * @param patch - Partial state fields.
   * @private
   */
  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    // this._search$.next();
  }

  /**
   * Invoke search with inputs
   * @private
   */
  private _search(): Observable<fhir.Bundle> {
    return this.mode === 'questionnaire'
      ? this.fhirService.search(this.searchTerm, this.searchField.field, {_count: this.pageSize})
      : this.fhirService.searchResources(
        this.resourceType,
        this.searchTerm,
        this.searchField.field,
        {_count: this.pageSize}
      );
  }


  /**
   * Search button handler.
   */
  searchInput() {
    if(!this.canSearch()) {
      return;
    }
    this.searchTerm = this.inputTerm;
    this._search$.next();
  }

  /** Configure this dialog to search for a resource to add to Questionnaire.contained. */
  configureForContainedResourceImport(): void {
    this.mode = 'contained-resource';
    this.resourceType = '';
    this.searchField = this.genericSearchFieldList[0];
    this.resetSearchState();
    this.loadResourceCapabilities();
  }

  /**
   * Update the selected resource type and discard results from the previous type.
   *
   * @param resourceType - Resource type selected from the server-advertised list.
   */
  onResourceTypeChange(resourceType: string): void {
    this.resourceType = resourceType?.trim() || '';
    this.searchField = this.genericSearchFieldList[0];
    this.resetSearchState();
  }

  /**
   * Determine whether the current dialog state is sufficient to submit a search.
   *
   * @returns True when search may be submitted.
   */
  canSearch(): boolean {
    return this.mode === 'questionnaire'
      ? !this.capabilityLoading
      : !this.capabilityLoading && this.resourceTypes.includes(this.resourceType);
  }

  /** Retry loading resource types from the selected FHIR server. */
  retryResourceCapabilities(): void {
    this.loadResourceCapabilities();
  }

  /**
   * Close the dialog with a mode-appropriate resource selection.
   *
   * @param resource - Search result selected by the user.
   */
  selectResource(resource: fhir.Resource): void {
    if(!resource?.id) {
      return;
    }
    const selection: FhirResourceSelection = {
      resourceType: resource.resourceType,
      id: resource.id
    };
    this.close(this.mode === 'questionnaire' ? resource.id : selection);
  }

  /**
   * Derive a concise label from common fields on an arbitrary FHIR resource.
   *
   * @param resource - Search result resource summary.
   * @returns Human-readable primary label.
   */
  getResourceDisplay(resource: any): string {
    return getContainedResourceDisplay(resource)
      || `${resource?.resourceType || 'Resource'}/${resource?.id || '(no id)'}`;
  }

  /**
   * Get a last-updated value suitable for a generic search-result summary.
   *
   * @param resource - Search result resource summary.
   * @returns Last-updated timestamp or an empty string.
   */
  getLastUpdated(resource: fhir.Resource): string {
    return (resource as fhir.DomainResource)?.meta?.lastUpdated || '';
  }

  /** Load resource and search-parameter capabilities for the selected server. */
  private loadResourceCapabilities(): void {
    const endpoint = this.selectedFHIRServer.endpoint;
    this.capabilityLoading = true;
    this.capabilityError = '';
    this.resourceCapabilities = [];
    this.resourceTypes = [];
    this.fhirService.getResourceCapabilities().subscribe({
      next: (capabilities) => {
        if(endpoint !== this.selectedFHIRServer.endpoint) {
          return;
        }
        this.resourceCapabilities = capabilities;
        this.resourceTypes = capabilities.map((capability) => capability.resourceType);
        this.capabilityLoading = false;
        if(!this.resourceTypes.length) {
          this.capabilityError = 'This server did not advertise any searchable resource types.';
        }
      },
      error: (error) => {
        if(endpoint !== this.selectedFHIRServer.endpoint) {
          return;
        }
        this.capabilityLoading = false;
        this.capabilityError = 'Unable to load resource types from the selected FHIR server.';
        console.error(this.capabilityError, error);
      }
    });
  }

  /**
   * Build search choices compatible with a single text input for the selected resource type.
   *
   * @returns Generic and server-advertised search fields.
   */
  private getGenericSearchFields(): SearchField[] {
    const supportedParameterTypes = new Set(['string', 'token', 'uri', 'reference']);
    const advertised = this.resourceCapabilities
      .find((capability) => capability.resourceType === this.resourceType)
      ?.searchParameters
      ?.filter((parameter) =>
        !parameter.name.startsWith('_') && supportedParameterTypes.has(parameter.type || '')
      )
      .map((parameter) => ({
        field: parameter.name,
        display: `${parameter.name}${parameter.type ? ` (${parameter.type})` : ''}`,
        searchFieldPlaceholder: `Search ${parameter.name}`
      })) || [];
    const fields = [...this.genericSearchFieldList, ...advertised];
    const names = new Set<string>();
    return fields.filter((field) => {
      if(names.has(field.field)) {
        return false;
      }
      names.add(field.field);
      return true;
    });
  }

  /** Clear results, pagination, input, and errors after the search context changes. */
  private resetSearchState(): void {
    this.inputTerm = '';
    this.searchTerm = '';
    this.resultsOffset = 0;
    this.total = undefined;
    this.searchError = null;
    this.errorDetailsShow = false;
    this._bundle$.next(null);
  }

  /**
   * Extract OperationOutcome issues from the different error shapes returned by FHIR clients.
   *
   * @param error - Search request error.
   * @returns OperationOutcome issues, if present.
   */
  private getOperationOutcomeIssues(error: any): fhir.OperationOutcomeIssue[] {
    if(Array.isArray(error?.error?.issue)) {
      return error.error.issue;
    }
    try {
      return JSON.parse(String(error?.message || '').replace(/^.*\n(?={)/s, ''))?.issue || [];
    }
    catch(_parseError) {
      return [];
    }
  }

  /**
   * Next page button handler
   */
  nextPage(): void {
    this.getBundleByUrl(this.nextUrl);
  }

  /**
   * Previous page button handler
   */
  prevPage(): void {
    this.getBundleByUrl(this.prevUrl);
  }

  /**
   * Get resource bundle using url, typically by navigation links.
   * @param url
   */
  getBundleByUrl(url: fhirPrimitives.url): void {
    this.fhirService.getBundleByUrl(url).subscribe((bundle) => {
      this._bundle$.next(bundle);
    });
  }

  /**
   * Get offset of results page. Used to calculate serial numbers on the page.
   * @param url
   */
  _getOffset(url: fhirPrimitives.url): number {
    let ret = '';
    if(url) {
      ret = new URL(url).searchParams.get('_getpagesoffset');
    }
    return ret ? parseInt(ret, 10) : 0;
  }

  /**
   * Handle dialog dismiss
   * @param reason
   */
  dismiss(reason: any): void {
    this.activeModal.dismiss(reason);
  }

  /**
   * Handle dialog close
   * @param value
   */
  close(value: any): void {
    this.activeModal.close(value);
  }

  /**
   * Get FHIR server list.
   */
  getServerList(): FHIRServer [] {
    return this.fhirService.fhirServerList;
  }

  protected readonly faExclamationTriangle = faExclamationTriangle;
}
