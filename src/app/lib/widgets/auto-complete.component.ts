import { Component, OnInit, Input } from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged, filter, map, startWith, switchMap} from 'rxjs/operators';
import {FetchService} from '../../fetch.service';

export interface Options {
  searchUrl: string;
  httpOptions: any;
  processResponse: (response: HttpResponse<any>) => Observable<Result[]>;
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
             placeholder="Search FHIR forms"
             [formControl]="myControl"
             required
             [matAutocomplete]="autoGroup">
      <mat-autocomplete #autoGroup="matAutocomplete">
          <mat-option *ngFor="let result of acResults" [value]="result.id">
            {{ result.title}}
          </mat-option>
      </mat-autocomplete>
    </mat-form-field>`,
  styles: []
})
export class AutoCompleteComponent implements OnInit {

  myControl = new FormControl();
  @Input()
  options: Options;
  acResults: Result [];

  constructor(private http: HttpClient, private lformsService: FetchService) { }

  ngOnInit() {
    if (!this.options.httpOptions.observe) {
      this.options.httpOptions.observe = 'body' as const;
    }
    if (!this.options.httpOptions.response) {
      this.options.httpOptions.responseType = 'json' as const;
    }
    this.myControl.valueChanges.pipe(
      startWith(''),
      filter(value => value.length > 2),
      debounceTime(10),
      distinctUntilChanged(),
      map(value => this._search(value))
      // switchMap((value) => this._search(value))
    ).subscribe((results) => {
      results.subscribe((res) => {
        this.acResults = res;
      });
    });
  }

  _search(value): Observable<Result []> {
    return this.lformsService.searchForms(value);
  }
}
