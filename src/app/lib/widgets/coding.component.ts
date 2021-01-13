import { Component, OnInit } from '@angular/core';
import {RowGridComponent} from './row-grid.component';

@Component({
  selector: 'app-coding',
  template: `
    <div class="form-row">
      <div [class]="gridClass(field)" *ngFor="let field of getShowFields()">
        <app-form-element [formProperty]="getShowFieldProperty(field)"></app-form-element>
      </div>
    </div>
  `,
  styles: [
  ]
})
export class CodingComponent extends RowGridComponent implements OnInit {

  ngOnInit(): void {
  }


}
