/**
 * Component for editing json of questionnaire item.
 *
 */
import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { JSONEditor } from '@json-editor/json-editor';
import {FetchService} from '../../../fetch.service';
import {ShareObjectService} from '../../../share-object.service';
import {forkJoin} from 'rxjs';


@Component({
  selector: 'lfb-item-json-editor',
  template: `
    <div class="card-container">
      <div #itemJsonEditor style="height: 500px;" ></div>
    </div>
  `
})
export class ItemJsonEditorComponent implements AfterViewInit {
  @ViewChild('itemJsonEditor') editorElement: ElementRef;
  val: any;

  constructor(private dataSrv: FetchService, private itemSrv: ShareObjectService) {}

  /**
   * Initialize component.
   */
  ngAfterViewInit(): void {
    // Setup JSONEditor widget based on questionnaire item's schema
    this.dataSrv.getItemEditorSchema().subscribe( (itemSchema) => {
      const editor = new JSONEditor(this.editorElement.nativeElement, {
        schema: itemSchema,
      });

      // Let listeners of object sharing service know about the changes.
      editor.on('change', () => {
        const val = editor.getValue();
        if (val !== this.val) {
          this.val = val;
          this.itemSrv.setObject(this.val);
        }
      });

      // Update the this editor's content with any update to the item from outside.
      this.itemSrv.objectStr$.subscribe((item) => {
        if (item !== this.val) {
          this.val = item;
          editor.setValue(this.val);
        }
      });
    });
  }
}
