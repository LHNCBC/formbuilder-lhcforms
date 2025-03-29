import {Component, inject} from '@angular/core';
import {FhirService, FHIRServer} from '../../../services/fhir.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import fhir from 'fhir/r4';
import {fhirPrimitives} from '../../../fhir';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
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
}
@Component({
  standalone: false,
  selector: 'lfb-fhir-search-dlg',
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

  /**
   * Define a structure to associate fhir search field, its modifiers, display and search input field placeholder.
   */
  searchFieldList: SearchField [] = [
    {field: '_content', display: 'Any text field', searchFieldPlaceholder: 'Search any text field'},
    {field: 'code', display: 'Item code', searchFieldPlaceholder: 'Search item code'},
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
    searchField: this.searchFieldList[0],
    fhirServer: this.fhirService.getFhirServer()
  };

  constructor(private activeModal: NgbActiveModal) {
    // Set up search pipeline
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      switchMap(() => this._search()),
      tap(() => this._loading$.next(false))
    ).subscribe((bundle) => {
      this.total = undefined; // Reset total before processing bundle
      this._bundle$.next(bundle);
    });

    // Set up bundle pipeline. Bundle could be invoked either by search or navigation.
    this.bundle$.pipe(map((bundle) => {
      this.questionnaires = null;
      if(!bundle) {
        return null; // Might happen when initializing _bundle$
      }
      if(bundle.total !== undefined) { // page bundles may not have total. The existing total is valid.
        this.total = bundle.total;
      }

      // Capture navigation urls.
      this.nextUrl = null;
      this.prevUrl = null;
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
  set selectedFHIRServer(fhirServer: FHIRServer) {
    this.fhirService.setFhirServer(fhirServer);
    this._set({fhirServer});
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
}
