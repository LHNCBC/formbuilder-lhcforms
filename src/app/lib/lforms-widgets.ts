import { DefaultWidgetRegistry } from 'ngx-schema-form';
import {RowLayoutComponent} from './row-layout/row-layout.component';
import {ArrayGridComponent} from './array-grid/array-grid.component';

export class LformsWidgets extends DefaultWidgetRegistry {
  constructor() {
    super();
    this.register('row-layout',  RowLayoutComponent);
    this.register('array-grid', ArrayGridComponent);
  }
}
