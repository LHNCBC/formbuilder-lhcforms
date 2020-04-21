import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ArrayWidget, FormProperty} from 'ngx-schema-form';
import {Form} from '@angular/forms';
import {PropertyGroup} from 'ngx-schema-form/lib/model';

@Component({
  selector: 'app-array-grid',
  template: `
    <div class="widget form-group">
      <label [attr.for]="id" class="horizontal control-label">
        {{ schema.title }}
      </label>
      <span *ngIf="schema.description" class="formHelp">{{schema.description}}</span>
      <tr *ngFor="let itemProperty of formProperty.properties">
        <td *ngFor="let showField of getShowFields()" [colSpan]="showField.col">
          <sf-form-element [formProperty]="getProperty(itemProperty, showField.field)"></sf-form-element>
        </td>
        <button (click)="removeItem(itemProperty)" class="btn btn-default array-remove-button"
                [disabled]="isRemoveButtonDisabled()"
                *ngIf="!(schema.hasOwnProperty('minItems') && schema.hasOwnProperty('maxItems') && schema.minItems === schema.maxItems)"
        >
          <span class="glyphicon glyphicon-minus" aria-hidden="true"></span> Remove
        </button>
      </tr>
      <button (click)="addItem()" class="btn btn-default array-add-button"
              [disabled]="isAddButtonDisabled()"
              *ngIf="!(schema.hasOwnProperty('minItems') && schema.hasOwnProperty('maxItems') && schema.minItems === schema.maxItems)"
      >
        <span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Add
      </button>
    </div>`
})
export class ArrayGridComponent extends ArrayWidget implements AfterViewInit {

  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (this.formProperty.properties.length === 0) {
      this.addItem();
    }
  }

  getShowFields(): string [] {
    let ret: string [] = [];
    if (this.formProperty.schema.widget && this.formProperty.schema.widget.showFields) {
      ret = this.formProperty.schema.widget.showFields;
    }
    return ret;
  }

  getProperty(parentProperty, propertyId) {
    return parentProperty.getProperty(propertyId);
  }
}

