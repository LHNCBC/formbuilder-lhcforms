import {Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import { JSONEditor } from '@json-editor/json-editor';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';

const qSchema = '/assets/fhir-questionnaire.schema.json';
const iSchema = '/assets/json-editor-item.schema.json';

@Component({
  selector: 'app-json-editor',
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.css']
})
export class JsonEditorComponent implements OnInit {
  @ViewChild('jsonEditor', {static: false}) elementRef: ElementRef;

  editor: JSONEditor;
  schema: any;
  selectedSource: string = iSchema;
  _val: any;
  constructor(private http: HttpClient, private startValSrv: ShareObjectService) {}

  ngOnInit() {
    this.http
      .get(this.selectedSource, { responseType: 'json' })
      .subscribe(schema => {
        this.schema = schema;
        this.editor = new JSONEditor(this.elementRef.nativeElement, {
          schema: this.schema,
          theme: 'bootstrap4',
          // iconlib: 'fontawesome5',
          // compact: true,
          required_by_default: true,
          disable_edit_json: true,
          // disable_collapse: true,
          disable_properties: true,
          disable_array_delete_all_rows: true,
          disable_array_delete_last_row: true
        });
        this.editor.on('change', () => {
          const _val = this.editor.getValue();
          if( _val !== this._val) {
            this._val = _val;
            this.startValSrv.setObject(this._val);
          }
        });
        this.startValSrv.object.subscribe((item) => {
          if(item !== this._val) {
            this._val = item;
            this.editor.setValue(this._val);
          }
        });
      });
  }
  getEditor() {
    return this.editor;
  }
/*
  _watcherCallback(path) {
    console.log('field with path: [' + path + '] changed to [' + JSON.stringify(this.getEditor()(path).getValue()) + ']');
    // Do something
  }

  watch() {
    for (const key in this.editor.editors) {
      if (this.editor.editors.hasOwnProperty(key) && key !== 'root') {
        this.editor.watch(key, this._watcherCallback.bind(this.editor, key));
      }
    }
  }
*/
}
