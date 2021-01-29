import {Component} from '@angular/core';
import {ObjectWidget} from 'ngx-schema-form';
import { Util } from '../util';
import {GridComponent} from "./grid.component";

@Component({
  selector: 'app-row-layout',
  template: `
<fieldset *ngFor="let fieldset of formProperty.schema.fieldsets">
  <legend *ngIf="fieldset.title">{{fieldset.title}}
    <button type="button" *ngIf="fieldset.description" class="btn btn-default glyphicon glyphicon-info" aria-label="Info"
            data-toggle="tooltip" [title]="fieldset.description"></button>
  </legend>
  <div class="row">

    <div [class]="gridClass(fld)" *ngFor="let fld of (fieldset.showFields || fieldset.fields)">
      <sf-form-element [formProperty]="getShowFieldProperty(fld)"></sf-form-element>
    </div>
  </div>
</fieldset>
`
})
export class RowLayoutComponent extends GridComponent {

  /*
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
  */
}
