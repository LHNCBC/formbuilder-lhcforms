import { Component, OnInit, Input } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {FetchService} from '../fetch.service';
import {map, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Result} from '../lib/widgets/auto-complete.component';

/**
 * Handles editing of form level fields.
 */
@Component({
  selector: 'app-form-fields',
  templateUrl: './form-fields.component.html',
  styleUrls: ['./form-fields.component.css']
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
  acSearch = (term: string): Observable<Result []> => {
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
