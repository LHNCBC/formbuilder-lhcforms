import { Component, OnInit } from '@angular/core';
import { GridComponent} from './grid.component';

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

  ngOnInit() {
    super.ngOnInit();
    this.rows = this.formProperty.schema.layout.formLayout.rows;
  }

}
