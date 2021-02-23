/**
 * Handles editing of form level fields.
 */
import { Component, OnInit, Input } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {FetchService} from '../fetch.service';
import {map, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {AutoCompleteResult} from '../lib/widgets/auto-complete/auto-complete.component';

@Component({
  selector: 'app-form-fields',
  template: `
    <div class="btn-toolbar" role="toolbar" aria-label="Menu bar">
      <div class="btn-group-sm mr-2" role="group" aria-label="Edit form attributes">
        <button type="button" class="btn btn-secondary" (click)="guidingStep = 'fl-editor'" [attr.disabled]="guidingStep === 'fl-editor' ? '' : null">Edit form attributes</button>
      </div>
      <div class="btn-group-sm mr-2" role="group" aria-label="Create questions">
        <button type="button" class="btn btn-secondary" (click)="editItem()" [attr.disabled]="guidingStep === 'item-editor' ? '' : null">Create questions</button>
      </div>
      <div class="btn-group-sm mr-2" role="group" aria-label="View Questionnaire JSON">
        <button type="button" class="btn btn-secondary" (click)="guidingStep = 'qJSON'" [attr.disabled]="guidingStep === 'qJSON' ? '' : null">View Questionnaire JSON</button>
      </div>
      <div class="btn-group-sm mr-2" role="group" aria-label="Start new form">
        <button type="button" class="btn btn-secondary " (click)="startNew()">Start new form</button>
      </div>
      <div class="btn-group-sm mr-2" role="group" aria-label="Save as">
        <button type="button" class="btn btn-secondary" (click)="saveAs()">Save as</button>
      </div>
    </div>

    <div class="card-body content">
      <app-item-component *ngIf="guidingStep === 'item-editor'" [form]="questionnaire"></app-item-component>
      <div  *ngIf="guidingStep === 'fl-editor'">
        <p>Enter basic information about the form.</p>
        <div class="container-fluid">
          <div class="row">
            <div class="col">
              <ul>
                <li>* fields are required.</li>
                <li>All other fields are optional.</li>
              </ul>
            </div>
            <div *ngIf="notHidden" class="col">
              <input type="checkbox" [(ngModel)]="notHidden">
              <app-auto-complete class="search-box container" placeholder="Search FHIR titles" [options]="acOptions" (optionSelected)="getForm($event.id)"></app-auto-complete>
            </div>
          </div>
        </div>
        <hr/>
        <div class="container-fluid">
          <sf-form [schema]="qlSchema"
                   [model]="questionnaire"
          ></sf-form>
        </div>
        <hr/>
        <div class="btn-toolbar float-right" role="toolbar" aria-label="Toolbar with button groups">
          <div class="btn-group-sm" role="group" aria-label="Advanced fields button">
            <button type="button" class="btn btn-primary mt-4 mr-2" (click)="allFields()">Enter Advanced fields</button>
            <button type="button" class="btn btn-primary mt-4 mr-2" (click)="editItem()">Create questions</button>
          </div>
          <div class="btn-group-sm ml-sm-1" role="group" aria-label="Create questions button">
          </div>
        </div>
      </div>
      <div *ngIf="guidingStep === 'qJSON'">
        <pre>{{ stringify(questionnaire) }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .content {
      padding: 0.5rem;
    }
  `]
})
export class FormFieldsComponent implements OnInit {

  @Input()
  questionnaire: any = {item: []};
  qlSchema: any = {properties: {}}; // Combines questionnaire schema with layout schema.
  guidingStep = 'fl-editor'; // 'choose-start', 'home', 'item-editor'
  notHidden = true;

  // Search LOINC forms from FHIR server.
  acOptions = {
    searchUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire',
    httpOptions: {
      observe: 'body' as const,
      responseType: 'json' as const
    }
  };

  /**
   * Call back to auto complete search.
   * @param term - Search term
   */
  acSearch = (term: string): Observable<AutoCompleteResult []> => {
    return this.dataSrv.searchForms(term);
  }

  constructor(private http: HttpClient, private modelService: ShareObjectService, private dataSrv: FetchService) {
  }

  /**
   * Merge schema and layout
   */
  ngOnInit() {
    // ngx-fl.schema.json is schema extracted from FHIR Questionnaire schema.
    this.http.get('/assets/ngx-fl.schema.json', { responseType: 'json' }).pipe(
      switchMap((schema: any) => this.http.get('/assets/fl-fields-layout.json', { responseType: 'json' }).pipe(
        map((layout: any) => {
          schema.layout = layout;
          return schema;
        })
      ))
    ).subscribe((schema) => {
      this.qlSchema = schema;
    });

  }


  /**
   * Moves to item editor screen.
   *
   */
  editItem() {
    this.guidingStep = 'item-editor';
    if (!this.questionnaire.item || this.questionnaire.item.length === 0) {
      this.questionnaire.item = [{text: 'New item', type: 'string'}];
    }
  }


  /**
   * TODO
   */
  startNew() {

  }


  /**
   * TODO
   */
  saveAs() {
  }

  /**
   * View full Questionnaire json
   */
  viewQuestionnaire() {
    this.guidingStep = 'qJSON';
  }


  /**
   * Json formatting
   * @param json - JSON object
   */
  stringify(json): string {
    return JSON.stringify(json, null, 2);
  }


  /**
   * TODO
   */
  allFields() {
  }


  /**
   * Get questionnaire by id
   * @param questionnaireId - Id of the questionnaire to fetch. If empty, return empty questionnaire.
   */
  getForm(questionnaireId: string) {
    if (!questionnaireId) {
      this.questionnaire = {status: 'draft', item: []};
    } else {
      this.dataSrv.getFormData(questionnaireId).subscribe((data) => {
        this.questionnaire = data;
        // this.model = this.questionnaire;
      });
    }
  }
}
