import { Component, OnInit, Input } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {FetchService} from '../fetch.service';

@Component({
  selector: 'app-form-fields',
  templateUrl: './form-fields.component.html',
  styleUrls: ['./form-fields.component.css']
})
export class FormFieldsComponent implements OnInit {

  @Input()
  questionnaire: any = {item: []};
  qlSchema: any = {properties: {}};
  qlTestSchema: any = {properties: {}};
  model: any;
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
    this.http
      .get('/assets/ngx-fl.schema.json', { responseType: 'json' })
      .subscribe(schema => {
        this.qlSchema = schema;
      });
    this.http
      .get('/assets/test.schema.json', { responseType: 'json' })
      .subscribe(schema => {
        this.qlTestSchema = schema;
      });

    this.modelService.object$.subscribe((model) => {
      if (this.model !== model) {
        this.model = model;
      }
    });
  }

  updateModel(model) {
    this.modelService.setObject(model);
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
  }

  allFields() {
  }

  getForm(term: string) {
    if (!term) {
      this.questionnaire = {status: 'draft', item: []};
    } else {
      this.dataSrv.getFormData(term).subscribe((data) => {
        this.questionnaire = data;
        this.model = this.questionnaire;
      });
    }
  }
}
