import { Component, OnInit } from '@angular/core';
import { JSONEditor } from '@json-editor/json-editor';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-json-editor',
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.css']
})
export class JsonEditorComponent implements OnInit {
  editor: JSONEditor;
  schema: any;
  editorElement: any;
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http
      .get('/assets/fhir-questionnaire.schema.json', { responseType: 'json' })
      .subscribe(schema => {
        this.schema = schema;
        this.editorElement = document.getElementById('json-editor');
        this.editor = new JSONEditor(this.editorElement, {
          schema: this.schema,
          ajax: true,
          theme: 'jqueryui'
        });
      });
  }

}
