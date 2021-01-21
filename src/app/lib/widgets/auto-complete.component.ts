import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged, filter, map, startWith, switchMap} from 'rxjs/operators';
import {FetchService} from '../../fetch.service';

export interface Options {
  searchUrl: string;
  httpOptions: any;
  processResponse?: (response: HttpResponse<any>) => Observable<Result[]>;
}

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
  @Output()
  optionSelected = new EventEmitter<Result>();
  @Input()
  searchCallback: (term: string) => Observable<Result[]>;

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
      filter(value => value.length > 2),
      debounceTime(100),
      distinctUntilChanged(),
      // map(value => this._search(value))
      switchMap((value) => this._search(value))
    );
  }

  selectOption(option) {
    this.optionSelected.emit(option);
  }

  displayFn(result: Result) {
    return result && result.title ? result.title : '';
  }

  _search(value): Observable<Result []> {
    return this.searchCallback(value);
    // return this.lformsService.searchForms(value);
  }
}
