import {Component, inject} from '@angular/core';
import {FhirService, FHIRServer} from '../../../services/fhir.service';
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
// Search related inputs on the page.
interface State {
  searchTerm: string;
  searchField: SearchField;
  fhirServer: FHIRServer;
}

interface SearchField {
  field: string,
  display: string,
  searchFieldPlaceholder: string
  supportedVersions?: FHIR_VERSION_TYPE []; // If not defined, assume all versions are supported.
}
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
  questionnaires: fhir.Questionnaire [];
  searchError: {message?: string, details?: string[]};
  errorDetailsShow = false;

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

  fhirService = inject(FhirService);
  /**
   * Define a structure to associate search parameters on the page.
   * @private
   */
  private _state: State = {
    searchTerm: '',
    searchField: this._searchFieldList[0],
    fhirServer: this.fhirService.getFhirServer()
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
          const errorList = JSON.parse(error.message.replace(/^.*\n(?={)/s, ''))?.issue

          this.searchError = {details: errorList?.map(e => e.diagnostics)};
          if (error.statusCode < 500 && error.statusCode >= 400) {
            this.searchError.message = 'The search parameters may not be supported by the selected FHIR server.';
          }
          else if (error.statusCode >= 500) {
            this.searchError.message = 'Server error - the selected FHIR server encountered an internal error.';
          }
          else {
            this.searchError.message = 'Error searching questionnaires.';
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
      return bundle.entry.map((e) => {
        // Trim down resource
        const res = e.resource;
        const ret = {};
        ['id', 'title', 'name', 'publisher', 'date', 'status', 'code'].forEach((f) => {
          if(res[f]) {
            ret[f] = res[f];
          }
        });
        return ret;
      });
    })
    ).subscribe((resources: fhir.Questionnaire []) => {
      this.questionnaires = resources;
    });
  }

  // Getters and setters
  get loading$() { return this._loading$.asObservable(); }
  get bundle$() { return this._bundle$.asObservable(); }
  get searchTerm() { return this._state.searchTerm; }
  set searchTerm(searchTerm: string) { this._set({searchTerm}); }
  get searchField() { return this._state.searchField; }
  set searchField(searchField: SearchField) { this._set({searchField});}
  get selectedFHIRServer() {return this._state.fhirServer;}

  /**
   * Set selected FHIR server. Make sure the search field is compatible with the selected FHIR server version.
   * @param fhirServer - Selected FHIR server.
   */
  set selectedFHIRServer(fhirServer: FHIRServer) {
    this.fhirService.setFhirServer(fhirServer);
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
   * Get filtered search field list based on selected FHIR server version, used to populate search field dropdown.
   */
  get searchFieldList(): SearchField [] {
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
    return this.fhirService.search(this.searchTerm, this.searchField.field, {_count: this.pageSize});
  }


  /**
   * Search button handler.
   */
  searchInput() {
    this.searchTerm = this.inputTerm;
    this._search$.next();
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
