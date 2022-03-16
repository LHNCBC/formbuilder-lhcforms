/**
 * Component for editing json of questionnaire item.
 *
 */
import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import * as ace from 'ace-builds';
import {FetchService} from '../../../services/fetch.service';
import {SharedObjectService} from '../../../services/shared-object.service';
import {AppJsonPipe} from '../../pipes/app-json.pipe';


@Component({
  selector: 'lfb-item-json-editor',
  template: `
    <div class="card-container">
      <div class="app-ace-editor" #itemJsonEditor style="height: 500px;" ></div>
    </div>
  `,
  styles: [
    `
      .app-ace-editor {
        border: 2px solid #f8f9fa;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
      }
    `,
  ],

})
export class ItemJsonEditorComponent implements AfterViewInit {
  @ViewChild('itemJsonEditor') editorElement: ElementRef;
  val: any;

  constructor(private dataSrv: FetchService, private itemSrv: SharedObjectService) {}

  /**
   * Initialize component.
   */
  ngAfterViewInit(): void {

    ace.config.set('fontSize', '14px');
    ace.config.set(
      'basePath',
      'https://unpkg.com/ace-builds@1.4.12/src-noconflict'
    );
    const aceEditor = ace.edit(this.editorElement.nativeElement);
    aceEditor.setTheme('ace/theme/twilight');
    aceEditor.session.setMode('ace/mode/json');
    aceEditor.on('change', () => {
      const val = aceEditor.getValue();
      if (val !== this.val) {
        this.val = val;
        this.itemSrv.setObject(this.val);
      }
    });

    // Update this editor's content with any update to the item from outside.
    this.itemSrv.currentItem$.subscribe((item) => {
      if (item !== this.val) {
        this.val = item;
        aceEditor.setValue(new AppJsonPipe().transform(this.val));
      }
    });
  }
}
