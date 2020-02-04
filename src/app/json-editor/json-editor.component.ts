import { Component, OnInit, Input } from '@angular/core';
import { JSONEditor } from '@json-editor/json-editor';
import {HttpClient} from '@angular/common/http';

const qSchema = '/assets/fhir-questionnaire.schema.json';
const iSchema = '/assets/item.schema.json';

@Component({
  selector: 'app-json-editor',
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.css']
})
export class JsonEditorComponent implements OnInit {
  editor: JSONEditor;
  schema: any;
  editorElement: any;
  selectedSource: string = iSchema;
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http
      .get(this.selectedSource, { responseType: 'json' })
      .subscribe(schema => {
        this.schema = schema;
        this.editorElement = document.getElementById('json-editor');
        this.editor = new JSONEditor(this.editorElement, {
          schema: this.schema,
          theme: 'jqueryui',
          iconlib: 'bootstrap3'
        });
      });
  }

  getEditor() {
    return this.editor;
  }

}
