/**
 * For layout of fields in rows. Field width could be entire 12 columns (bootstrap grid size),
 * in which case next field starts on next line.
 */
import { Component, OnInit } from '@angular/core';
import { GridComponent} from '../grid.component/grid.component';

@Component({
  selector: 'lfb-row-layout',
  template: `
    <div *ngFor="let row of rows">
      <div [class]="gridClass(field)" class="lfb-row" [ngClass]="{hideRow: isHidden(field)}" *ngFor="let field of getShowFields(row)">
        <lfb-form-element [formProperty]="getShowFieldProperty(field)"></lfb-form-element>
      </div>
    </div>
  `,
  styles: [`
    .lfb-row {
      border-bottom: lightgrey solid 1px;
      padding: 2px 0 2px 0;
    }
    .lfb-row:hover {
      background-color: lightgoldenrodyellow;
    }

    .hideRow {
      border: none !important;
      padding: 0 !important;
    }
  `]
})
export class RowLayoutComponent extends GridComponent implements OnInit {

  rows: any = [];

  /**
   * Initialize
   */
  ngOnInit() {
    // Read rows from schema layout
    this.rows = this.formProperty.schema.layout.formLayout.rows;
  }

  /**
   * Check to see if it is a hidden field. Intended to apply hideRow class.
   * @param field - Field id.
   */
  isHidden(field): boolean {
    return this.getWidgetId(field) === 'hidden';
  }
}
