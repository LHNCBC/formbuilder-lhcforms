import { Component, OnInit } from '@angular/core';
import {ObjectWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {Util} from '../util';


/**
 * TODO -- Consolidate with GridComponent.
 * Grid component to layout multiple fields in horizontal layout using bootstrap grid classes.
 */
@Component({
  selector: 'app-row-grid',
  template: `
      <div class="form-row">
        <div [class]="gridClass(field)" *ngFor="let field of getShowFields()">
          <app-form-element [nolabel]="nolabel" [formProperty]="getShowFieldProperty(field)"></app-form-element>
        </div>
      </div>
  `,
  styles: [
  ]
})
export class RowGridComponent extends ObjectWidget implements OnInit {
  faInfo = faInfoCircle;
  nolabel = false;

  ngOnInit(): void {
    // console.log(this.formProperty.path);
    // console.log(JSON.stringify(this.formProperty.value, null, 2));
  }

  /**
   * TODO - Duplicate code from GridComponent
   * @param showField
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
   * Get bootstrap column class from field layout spec.
   * @param showField
   */
  gridClass(showField) {
    return showField && showField.col ? 'col-' + showField.col : 'col';
  }

  /**
   * Get list of property ids that are visible (based on visibleIf of ngx-schema-form).
   */
  getShowFields(): string [] {
    let ret: string [] = [];
    if (this.formProperty.schema.widget && this.formProperty.schema.widget.showFields) {
      const showFields = this.formProperty.schema.widget.showFields;
      ret = showFields.filter((field) => {
        const propId = typeof field === 'string' ? field : typeof field === 'object' ? field.field : null;
        return Util.isVisible(this.formProperty, propId);
      });
    }
    return ret;
  }
}
