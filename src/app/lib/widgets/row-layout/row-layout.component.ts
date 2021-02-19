/**
 * For layout of fields in rows. Field width could be entire 12 columns (bootstrap grid size),
 * in which case next field starts on next line.
 */
import { Component, OnInit } from '@angular/core';
import { GridComponent} from '../grid.component/grid.component';

@Component({
  selector: 'app-row-layout',
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
export class RowLayoutComponent extends GridComponent implements OnInit {

  rows: any = [];

  /**
   * Initialize
   */
  ngOnInit() {
    // Read rows from schema layout
    this.rows = this.formProperty.schema.layout.formLayout.rows;
  }

}
