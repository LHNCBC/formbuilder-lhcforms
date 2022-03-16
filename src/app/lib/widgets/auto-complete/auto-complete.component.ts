/**
 * Define auto complete options
 */
import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged, filter, map, startWith, switchMap} from 'rxjs/operators';
import {FetchService} from '../../../services/fetch.service';

export interface Options {
  searchUrl: string;
  httpOptions: any;
  processResponse?: (response: HttpResponse<any>) => Observable<AutoCompleteResult[]>;
}

export interface AutoCompleteResult {
/**
 * Define result item for auto complete results
 */
  title: string;
  id: string;
}
@Component({
  selector: 'lfb-auto-complete',
  template: `
    <mat-form-field>
      <input type="text"
             matInput
             [placeholder]="placeholder"
             [formControl]="myControl"
             [matAutocomplete]="autoGroup">
      <mat-autocomplete autoActiveFirstOption [disableRipple]="true" #autoGroup="matAutocomplete" [panelWidth]="'100%'"
                        [displayWith]="displayFn" (optionSelected)="selectOption($event.option.value)">
        <mat-option *ngFor="let result of acResults | async" [value]="result">
          <div class="container-fluid">
            <div class="form-row">
              <div class="col-1"><small>id: {{result.id}}</small></div><div class="col-11"><small>{{result.title}}</small></div>
            </div>
          </div>
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: ['.mat-form-field {width: inherit; }']
})
export class AutoCompleteComponent implements OnInit {

  myControl = new FormControl();
  @Input()
  placeholder;
  @Input()
  options: Options;
  acResults: Observable<AutoCompleteResult[]>;
  // Selected event
  @Output()
  optionSelected = new EventEmitter<AutoCompleteResult>();
  @Input()
  searchCallback: (term: string) => Observable<AutoCompleteResult[]>;

  constructor(private http: HttpClient, private lformsService: FetchService) { }

  ngOnInit() {
    if (!this.options.httpOptions.observe) {
      this.options.httpOptions.observe = 'body' as const;
    }
    if (!this.options.httpOptions.response) {
      this.options.httpOptions.responseType = 'json' as const;
    }
    this.acResults = this.myControl.valueChanges.pipe(
      startWith(''),
      filter(value => value.length > 2), // Minimum two characters to search
      debounceTime(100), // Wait for 100 millis of typing delays
      distinctUntilChanged(), // Input should be changed
      switchMap((value) => this._search(value)) // Final search term
    );
  }

  /**
   *   Handle user selection of a result item.
   *   @param result - Selected result item.
   */
  selectOption(result: AutoCompleteResult) {
    this.optionSelected.emit(result);
  }

  /**
   * Format result item display
   * @param result - Result item to format
   */
  displayFn(result: AutoCompleteResult) {
    return result && result.title ? result.title : '';
  }

  /**
   * Search lforms service
   * @param value - Search term from the input
   * @private
   */
  _search(value): Observable<AutoCompleteResult []> {
    return this.searchCallback(value);
    // return this.lformsService.searchForms(value);
  }
}
