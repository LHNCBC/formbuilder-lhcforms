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
  val: any;
  constructor(private http: HttpClient, private startValSrv: ShareObjectService) {}

  ngOnInit() {
    this.http
      .get(this.selectedSource, { responseType: 'json' })
      .subscribe(schema => {
        this.schema = schema;
        this.editor = new JSONEditor(this.elementRef.nativeElement, {
          schema: this.schema,
          theme: 'bootstrap4',
          // iconlib: 'foundation6',
          // compact: true,
          required_by_default: true,
          disable_edit_json: true,
          // disable_collapse: true,
          disable_properties: true,
          disable_array_delete_all_rows: true,
          disable_array_delete_last_row: true
        });
        this.patchRegisterDependencies();
        this.setupWatchesOnType();
        this.editor.on('change', () => {
          const val = this.editor.getValue();
          if ( val !== this.val) {
            this.val = val;
            this.startValSrv.setObject(this.val);
          }
        });
        this.startValSrv.object.subscribe((item) => {
          if (item !== this.val) {
            this.val = item;
            this.editor.setValue(this.val);
          }
        });
      });
  }
  getEditor() {
    return this.editor;
  }

  setupWatchesOnType() {
    const thisComponent = this;
    /*
    this.editor.watch('root.type', (value) => {
      const valueType = this._valueType(thisComponent.editor.getEditor('root.type').getValue());
      console.log('Watching root.type == ', valueType);
      thisComponent._activateValueField(valueType);
    });
*/
    this.editor.on('addRow', (editor) => {
      const valueType = this._valueType(thisComponent.editor.getEditor('root.type').getValue());
      console.log('Watching root.type == ', valueType);
      thisComponent._activateValueField(valueType);
    });
  }

  _activateValueField(valueType) {
      [
        'valueBoolean',
        'valueInteger',
        'valueDecimal',
        'valueString',
        'valueUri',
        'valueDate',
        'valueDateTime',
        'valueTime',
        'valueReference',
        'valueAttachment',
        'valueCoding',
        'value'
      ].forEach((field) => {
        this._getAllValueEditors().forEach((editor) => {
            if (field === valueType) {
              console.log('Activating', editor.path);
              // editor.enable();
            } else {
              console.log('Deactivating', editor.path);
              // editor.disable();
            }
        });
      });
  }

  patchRegisterDependencies() {
    const editor = this.editor;
    editor.registerDependencies = () => {
      editor.dependenciesFulfilled = true;
      const deps = editor.options.dependencies;
      if (!deps) {
        return;
      }

      Object.keys(deps).forEach(dependency => {
        let path;
        if (dependency.startsWith('root.')) {
          path = dependency;
        } else {
          path = editor.path.split('.');
          path[path.length - 1] = dependency;
          path = path.join('.');
        }
        const choices = deps[dependency];
        editor.jsoneditor.watch(path, () => {
          editor.checkDependency(path, choices);
        });
      });
    };
    editor.jsoneditor.registerDependencies = editor.registerDependencies;
  }
/*
  this.editor.registerDependencies = function () {
    this.dependenciesFulfilled = true
    const deps = this.options.dependencies
    if (!deps) {
      return
    }

    Object.keys(deps).forEach(dependency => {
      let path = this.path.split('.')
      path[path.length - 1] = dependency
      path = path.join('.')
      const choices = deps[dependency]
      this.jsoneditor.watch(path, () => {
        this.checkDependency(path, choices)
      })
    })
  };
*/
  _getAllValueEditors() {
    const ret = [];
    ['root.answerOption', 'root.initial'].map((el) => {
      this.editor.getEditor(el).rows.forEach((row) => {
        Object.keys(row.editors).forEach((key) => {
          const editor = row.editors[key];
          if (key.startsWith('value') && !editor.schema.options.hidden) {
            ret.push(editor);
          }
        });
      });
    });
    return ret;
  }
  _valueType(type) {
    return (type ? 'value' + type.charAt(0).toUpperCase() + type.slice(1) : null);
  }

  destroy() {
    if (this.editor) {
      this.editor.destroy();
    }
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
