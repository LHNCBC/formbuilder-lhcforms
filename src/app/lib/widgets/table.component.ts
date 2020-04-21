import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ArrayWidget} from 'ngx-schema-form';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import {faMinusCircle} from '@fortawesome/free-solid-svg-icons';
import {Util} from '../util';

@Component({
  selector: 'app-table',
  template: `
    <div class="widget form-group">
      <app-label [title]="schema.title"[helpMessage]="schema.description" [for]="id"></app-label>
      <div class="container">
        <table class="table table-borderless table-sm" *ngIf="formProperty.properties.length > 0">
          <thead class="thead-light">
          <tr>
            <th *ngFor="let showField of getShowFields()" [colSpan]="showField.col">
              <app-title
                [title]="getTitle(formProperty.properties[0], showField.field)"
                [helpMessage]="getProperty(formProperty.properties[0], showField.field).schema.description"
              ></app-title>
            </th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let itemProperty of formProperty.properties">
            <td *ngFor="let showField of getShowFields()" [colSpan]="showField.col">
              <app-form-element nolabel="true" [formProperty]="getProperty(itemProperty, showField.field)"></app-form-element>
            </td>
            <td class="align-middle">
              <button (click)="removeItem(itemProperty)" class="btn btn-default btn-link btn-sm array-remove-button"
                      [disabled]="isRemoveButtonDisabled()"
                      *ngIf="!(schema.hasOwnProperty('minItems') &&
                               schema.hasOwnProperty('maxItems') &&
                               schema.minItems === schema.maxItems)"
              >
                <fa-icon [icon]="faRemove" aria-hidden="true"></fa-icon> Remove
              </button>
            </td>
          </tr>
          </tbody>
        </table>
        <button (click)="addItem()" class="btn btn-default btn-link array-add-button"
                [disabled]="isAddButtonDisabled()"
                *ngIf="!(schema.hasOwnProperty('minItems') && schema.hasOwnProperty('maxItems') && schema.minItems === schema.maxItems)"
        >
          <fa-icon [icon]="faAdd" aria-hidden="true"></fa-icon> Add
        </button>
      </div>
    </div>`
})
export class TableComponent extends ArrayWidget implements AfterViewInit {

  faAdd = faPlusCircle;
  faRemove = faMinusCircle;

  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (this.formProperty.properties.length === 0) {
      this.addItem();
    }
  }

  getShowFields(): string [] {
    let ret: string [] = [];
    if (this.formProperty.schema.widget && this.formProperty.schema.widget.showFields) {
      const showFields = this.formProperty.schema.widget.showFields;
      ret = showFields.filter((field) => {
        return this.isVisible(field.field);
      });
    }
    return ret;
  }

  isVisible(propertyId) {
    const path = propertyId.split('.');
    let formProperty = this.formProperty.properties[0];
    let visible = formProperty.visible;
    for (let i = 0; i < path.length && visible; i++) {
      formProperty = formProperty.getProperty(path[i]);
      visible = formProperty.visible;
    }
    return visible;
  }

  getProperty(parentProperty, propertyId) {
    const path = propertyId.split('.');
    let p = parentProperty;
    for (const id of path) {
      p = p.getProperty(id);
    }
    return p;
  }

  getTitle(parentProperty, propertyId) {
    const p = this.getProperty(parentProperty, propertyId);
    return p.schema && p.schema.title ? p.schema.title : Util.capitalize(propertyId);
  }
}
