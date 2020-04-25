import { DefaultWidgetRegistry } from 'ngx-schema-form';
import {RowLayoutComponent} from './widgets/row-layout.component';
import {ArrayGridComponent} from './widgets/array-grid.component';
import {GridComponent} from './widgets/grid.component';
import {TableComponent} from './widgets/table.component';
import {StringComponent} from './widgets/string.component';
import {SelectComponent} from './widgets/select.component';
import {CheckboxComponent} from './widgets/checkbox.component';
import {IntegerComponent} from './widgets/integer.component';
import {RadioComponent} from './widgets/radio.component';

export class LformsWidgets extends DefaultWidgetRegistry {
  constructor() {
    super();
    this.register('row-layout',  RowLayoutComponent);
    this.register('array-grid', ArrayGridComponent);
    this.register('grid', GridComponent);
    this.register('table', TableComponent);
    this.register('string', StringComponent);
    this.register('select', SelectComponent);
    this.register('checkbox', CheckboxComponent);
    this.register('boolean', CheckboxComponent);
    this.register('integer', IntegerComponent);
    this.register('number', IntegerComponent);
    this.register('radio', RadioComponent);
  }
}
