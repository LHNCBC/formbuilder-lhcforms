import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {AutoCompleteResult} from './auto-complete/auto-complete.component';
import {FetchService} from '../../fetch.service';

@Component({
  selector: 'app-app-dialog',
  template: `
      <div mat-dialog-title>
        <span>{{data.title}}</span>
        <button class="float-right" mat-icon-button (click)="onNoClick()">
          <mat-icon>clear</mat-icon>
        </button>
      </div>
      <div mat-dialog-content>
        <!--
              <mat-form-field>
                <mat-label>Favorite Animal</mat-label>
                <input matInput [(ngModel)]="data.animal">
              </mat-form-field>
              -->
        <app-auto-complete id="searchBox"
                           class="search-box container"
                           placeholder="Search LOINC items"
                           [options]="acOptions"
                           (optionSelected)="dialogRef.close($event.id)"
                           [searchCallback]="acSearch"
        ></app-auto-complete>
      </div>
      <div mat-dialog-actions>
        <button mat-button (click)="onNoClick()">Cancel</button>
      </div>
  `,
  styles: [`
    .float-right {
      float: right;
    }

    .full-width {
      width: 100%;
    }
  `]
})
export class AddItemDialogComponent implements OnInit {
  acOptions = {
    searchUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire',
    httpOptions: {
      observe: 'body' as const,
      responseType: 'json' as const
    }
  };

  acSearch = (term): Observable<AutoCompleteResult []> => {
    return this.dataSrv.searchLoincItems(term);
  }

  constructor(
    private dataSrv: FetchService,
    public dialogRef: MatDialogRef<AddItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
  }

  /*
  itemSelected(item) {
    this.dialogRef.close(item.id);

  }
  */

  onNoClick(): void {
    this.dialogRef.close();
  }
}


