import { Component, OnInit, Input } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {FetchService} from '../fetch.service';
import {map, switchMap} from 'rxjs/operators';

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

  acOptions = {
    searchUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire',
    httpOptions: {
      observe: 'body' as const,
      responseType: 'json' as const
    }
  };

  constructor(private http: HttpClient, private modelService: ShareObjectService, private dataSrv: FetchService) {
  }

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
  // Button handlers
  editItem() {
    this.guidingStep = 'item-editor';
    if (!this.questionnaire.item || this.questionnaire.item.length === 0) {
      this.questionnaire.item = [{text: 'New item', type: 'string'}];
    }
  }

  startNew() {
  }

  saveAs() {
  }

  viewQuestionnaire() {
    this.guidingStep = 'qJSON';
  }

  stringify(json): string {
    return JSON.stringify(json, null, 2);
  }

  allFields() {
  }

  getForm(term: string) {
    if (!term) {
      this.questionnaire = {status: 'draft', item: []};
    } else {
      this.dataSrv.getFormData(term).subscribe((data) => {
        this.questionnaire = data;
        // this.model = this.questionnaire;
      });
    }
  }
}
