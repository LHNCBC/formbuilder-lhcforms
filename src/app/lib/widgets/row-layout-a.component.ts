import { Component, OnInit } from '@angular/core';
import { GridComponent} from './grid.component';

/**
 * For layout of fields in rows. Field width could be entire 12 columns (bootstrap grid size),
 * in which case next field starts on next line.
 */
@Component({
  selector: 'app-row-layout-a',
  template: `
    <div *ngFor="let row of rows">
      <div [class]="gridClass(field)" *ngFor="let field of getShowFields(row)">
        <app-form-element [formProperty]="getShowFieldProperty(field)"></app-form-element>
      </div>
    </div>
  `,
  styles: [
  ]
})
export class RowLayoutAComponent extends GridComponent implements OnInit {

  rows: any = [];

  /**
   * Initialize
   */
  ngOnInit() {
    // Read rows from schema layout
    this.rows = this.formProperty.schema.layout.formLayout.rows;
  }

}
