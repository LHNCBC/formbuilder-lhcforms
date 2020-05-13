import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { JSONEditor } from '@json-editor/json-editor';
import {FetchService} from '../fetch.service';
import {ShareObjectService} from '../share-object.service';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-item-json-editor',
  templateUrl: './item-json-editor.component.html',
  styleUrls: ['./item-json-editor.component.css']
})
export class ItemJsonEditorComponent implements AfterViewInit {
  @ViewChild('itemJsonEditor') editorElement: ElementRef;
  _val: any;

  constructor(private dataSrv: FetchService, private itemSrv: ShareObjectService) {}
  ngAfterViewInit(): void {
    this.dataSrv.getItemEditorSchema().subscribe( (schema) => {
      const editor = new JSONEditor(this.editorElement.nativeElement, {
        schema: schema,
      });
      editor.on('change', () => {
        const _val = editor.getValue();
        if(_val !== this._val) {
          this._val = _val;
          this.itemSrv.setObject(this._val);
        }
      });
      this.itemSrv.objectStr.subscribe((item) => {
        if(item !== this._val) {
          this._val = item;
          editor.setValue(this._val);
        }
      });
    });

  }
}
