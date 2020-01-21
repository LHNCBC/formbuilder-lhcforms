import { Component, OnInit } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-ngx-schema-form',
  templateUrl: './ngx-schema-form.component.html',
  styleUrls: ['./ngx-schema-form.component.css']
})
export class NgxSchemaFormComponent implements OnInit {
  mySchema: any;
  myTestSchema: any;
  myModel: any = {};
  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.http
      .get('/assets/fhir-questionnaire.schema.json', { responseType: 'json' })
      .subscribe(schema => {
        this.mySchema = schema;
      });
    this.http
      .get('/assets/test.schema.json', { responseType: 'json' })
      .subscribe(schema => {

        this.myTestSchema = schema;
      });
  }
}
