import {Component} from '@angular/core';
import {ObjectWidget} from 'ngx-schema-form';
import {Util} from '../util';


/**
 *
 * A component to layout multiple fields in horizontal layout using bootstrap grid
 */
@Component({
  selector: 'app-grid',
  template: `
    <div *ngFor="let fieldset of formProperty.schema.fieldsets">
      <legend *ngIf="fieldset.title">{{fieldset.title}}</legend>
      <span *ngIf="fieldset.description" data-toggle="tooltip" [title]="fieldset.description" class="glyphicon glyphicon-info" ></span>
      <div class="form-row">
        <div [class]="gridClass(field)" *ngFor="let field of getShowFields(fieldset)">
          <sf-form-element [formProperty]="getShowFieldProperty(field)"></sf-form-element>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid-border {
      border: lightgray 1px solid;
    }
    .grid-padding {
      padding: 0 5px 0 5px;
    }
  `]
})
export class GridComponent extends ObjectWidget {

  /**
   * Get formProperty (refer to ngx-schema-form) of a showField (refer to assets/*layout.json).
   *
   * @param showField - Field object, see the assets/*-layout.json for the definition
   */
  getShowFieldProperty(showField) {
    const fieldId = typeof showField === 'string' ? showField : typeof showField === 'object' ? showField.field : null;
    const ret = this.formProperty.getProperty(fieldId);
    const schema = ret.schema;
    if (schema && !schema.title) {
      schema.title = Util.capitalize(fieldId);
    }
    return ret;
  }

  /**
   * Return bootstrap column class based on showField's definition.
   *
   * @param showField
   */
  gridClass(showField) {
    return showField && showField.col ? 'col-' + showField.col : 'col';
  }

  /**
   * Return show fields from fieldset. Fieldset and showFields are specified in layout json.
   *
   * @param fieldset
   */
  getShowFields(fieldset) {
    let ret = fieldset.showFields;
    ret = !ret ? fieldset.fields.map((e) => ({field: e})) : ret;
    ret = ret.filter((field) => {
      const propId = typeof field === 'string' ? field : typeof field === 'object' ? field.field : null;
      return Util.isVisible(this.formProperty, propId);
    });
    return ret;
  }
}
