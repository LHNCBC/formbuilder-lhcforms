import { Component, OnInit } from '@angular/core';
import {GridComponent} from '../grid.component/grid.component';

/**
 *
 */
@Component({
  standalone: false,
  selector: 'lfb-left-label-form-group',
  template: `
      <div class="form-group row" *ngFor="let field of getShowFields()">
        <div [ngClass]="labelWidthClass + ' ps-0 pe-1'">
          <lfb-label
            [for]="getShowFieldProperty(field).id"
            [title]="getSchema(field).title"
            [helpMessage]="getSchema(field).description"
          ></lfb-label>
        </div>
        <div [class]="controlWidthClass" >
          <lfb-form-element
            [nolabel]="true"
            [formProperty]="getShowFieldProperty(field)"
          ></lfb-form-element>
        </div>
      </div>
  `,
  styles: [`
    .form-group {
      margin: 0;
    }
    .row {
      margin: 0;
    }
    :host ::ng-deep .col,.col-1,.col-2,.col-3,.col-4,.col-5,.col-6,.col-7,.col-8,.col-9,.col-10,.col-11,.col-12,
    .col-sm,.col-sm-1,.col-sm-2,.col-sm-3,.col-sm-4,.col-sm-5,.col-sm-6,.col-sm-7,.col-sm-8,.col-sm-9,.col-sm-10,.col-sm-11,.col-sm-12
    {
      padding-right: 5px;
      padding-left: 5px;
    }
  `]
})
export class LeftLabelFormGroupComponent  extends GridComponent implements OnInit {

  labelWidthClass: string;
  controlWidthClass: string;
  label = true;

  ngOnInit(): void {
    const w = this.formProperty.schema.widget;
    this.labelWidthClass = w && w.labelWidth ? 'col-sm-' + w.labelWidth : 'col-sm';
    this.controlWidthClass = w && w.controlWidth ? 'col-sm-' + w.controlWidth : 'col-sm';
    this.label = w.label;
  }

  getShowFields(): string[] {
    return super.getShowFields(this.formProperty.schema.widget);
  }

  getSchema(propId: string) {
    return this.getShowFieldProperty(propId).schema;
  }
}
