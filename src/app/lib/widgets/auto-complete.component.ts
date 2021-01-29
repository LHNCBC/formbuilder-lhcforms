import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged, filter, map, startWith, switchMap} from 'rxjs/operators';
import {FetchService} from '../../fetch.service';

/**
 * Define auto complete options
 */
export interface Options {
  searchUrl: string;
  httpOptions: any;
  processResponse?: (response: HttpResponse<any>) => Observable<Result[]>;
}

/**
 * Define result item for auto complete results
 */
export interface Result {
  title: string;
  id: string;
}
@Component({
  selector: 'app-auto-complete',
  template: `
    <mat-form-field>
      <input type="text"
             matInput
             [placeholder]="placeholder"
             [formControl]="myControl"
             [matAutocomplete]="autoGroup">
      <mat-autocomplete [disableRipple]="true" #autoGroup="matAutocomplete" [panelWidth]="'100%'"
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
  acResults: Observable<Result[]>;
  // Selected event
  @Output()
  optionSelected = new EventEmitter<Result>();

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
  selectOption(result: Result) {
    this.optionSelected.emit(result);
  }

  /**
   * Format result item display
   * @param result - Result item to format
   */
  displayFn(result: Result) {
    return result && result.title ? result.title : '';
  }

  /**
   * Search lforms service
   * @param value - Search term from the input
   * @private
   */
  _search(value): Observable<Result []> {
    return this.lformsService.searchForms(value);
  }
}
