import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ObjectWidget} from 'ngx-schema-form';
import {Util} from '../util';

@Component({
  selector: 'app-grid',
  template: `
    <div *ngFor="let fieldset of formProperty.schema.fieldsets">
      <legend *ngIf="fieldset.title">{{fieldset.title}}</legend>
      <span *ngIf="fieldset.description" data-toggle="tooltip" [title]="fieldset.description" class="glyphicon glyphicon-info" ></span>
      <div class="row">
        <div [class]="gridClass(field)" *ngFor="let field of getShowFields(fieldset)">
          <sf-form-element [formProperty]="getShowFieldProperty(field)"></sf-form-element>
        </div>
      </div>
    </div>
  `
})
export class GridComponent extends ObjectWidget implements OnInit {

  constructor() {
    console.log('GridComponent constructor()');
    super();
  }
  ngOnInit() {
    console.log('Entering on init');
  }

  getShowFieldProperty(showField) {
    const fieldId = typeof showField === 'string' ? showField : typeof showField === 'object' ? showField.field : null;
    const ret = this.formProperty.getProperty(fieldId);
    const schema = ret.schema;
    if (schema && !schema.title) {
      schema.title = Util.capitalize(fieldId);
    }
    return ret;
  }

  gridClass(showField) {
    return showField && showField.col ? 'col-' + showField.col : 'col';
  }

  getShowFields(fieldset) {
    let ret = fieldset.showFields;
    ret = !ret ? fieldset.fields.map((e) => { return {field: e}; }) : ret;
    return ret;
  }
}
