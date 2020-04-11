import {Component} from '@angular/core';
import {ObjectWidget} from 'ngx-schema-form';
import { Util } from '../util';

@Component({
  selector: 'app-object-horizontal',
  templateUrl: './row-layout.component.html',
  styleUrls: ['./row-layout.component.css']
})
export class RowLayoutComponent extends ObjectWidget {

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
}
