import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ArrayWidget} from 'ngx-schema-form';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import {faAngleDown} from '@fortawesome/free-solid-svg-icons';
import {faAngleRight} from '@fortawesome/free-solid-svg-icons';
import {Util} from '../util';
import {AppArrayWidgetComponent} from './app-array-widget.component';

@Component({
  selector: 'app-table',
  template: `
    <div class="widget form-group"  [ngClass]="{'row': labelPosition === 'left'}">
      <div [ngClass]="labelWidthClass">
        <button *ngIf="!noCollapseButton" href="#" type="button" class="btn btn-default collapse-button" (click)="isCollapsed = !isCollapsed"
                [attr.aria-expanded]="!isCollapsed" aria-controls="collapseTable">
          <fa-icon [icon]="isCollapsed ? faRight : faDown" aria-hidden="true"></fa-icon>
        </button>
        <app-label *ngIf="!noTableLabel" [title]="schema.title" [helpMessage]="schema.description" [for]="id"></app-label>
      </div>
      <div class="card p-0 {{controlWidthClass}}" id="collapseTable" [ngbCollapse]="isCollapsed">
        <table class="table table-borderless table-sm app-table" *ngIf="formProperty.properties.length > 0">
          <thead class="thead-light">
          <tr class="d-flex">
            <th *ngFor="let showField of getShowFields()" class="col-sm-{{showField.col}}">
              <app-title
                [title]="getTitle(formProperty.properties[0], showField.field)"
                [helpMessage]="getProperty(formProperty.properties[0], showField.field).schema.description"
              ></app-title>
            </th>
            <th class="col-sm"></th>
          </tr>
          </thead>
          <tbody>
          <tr class="d-flex" *ngFor="let itemProperty of formProperty.properties">
            <td *ngFor="let showField of getShowFields()" class="col-sm-{{showField.col}}">
              <app-form-element nolabel="true" [formProperty]="getProperty(itemProperty, showField.field)"></app-form-element>
            </td>
            <td class="col-sm-1 align-middle action-column">
              <button (click)="removeItem(itemProperty)" class="btn btn-default btn-link btn-sm array-remove-button"
                      [disabled]="isRemoveButtonDisabled()"
                      *ngIf="!(schema.hasOwnProperty('minItems') &&
                               schema.hasOwnProperty('maxItems') &&
                               schema.minItems === schema.maxItems)"
                      matTooltip="Remove" matTooltipPosition="above"
              >
                <fa-icon [icon]="faRemove" aria-hidden="true"></fa-icon></button>
            </td>
          </tr>
          </tbody>
        </table>
        <button (click)="addItem()" class="btn btn-light btn-link array-add-button"
                [disabled]="isAddButtonDisabled()"
                *ngIf="!(schema.hasOwnProperty('minItems') && schema.hasOwnProperty('maxItems') && schema.minItems === schema.maxItems)"
        >
          <fa-icon [icon]="faAdd" aria-hidden="true"></fa-icon> {{addButtonLabel}}
        </button>
      </div>
    </div>`,
  styles: [`
    .action-column {
      text-align: end;
    }
    .collapse-button {
      padding-left: 5px;
      padding-right: 5px;
      margin-right: 5px;
      margin-left: 2px;
    }

    .app-table {
      margin-bottom: 0;
    }
    .app-table th {
      text-align: center;
    }
    .app-table th, .app-table td {
      padding-bottom: 0;
  /*    vertical-align: bottom; */
    }
    .table-header {
      font-weight: normal;
    }
  `]
})
export class TableComponent extends AppArrayWidgetComponent implements AfterViewInit {

  faAdd = faPlusCircle;
  faRemove = faTrash;
  faRight = faAngleRight;
  faDown = faAngleDown;
  isCollapsed = false;
  addButtonLabel = 'Add';
  noCollapseButton = false;
  noTableLabel = false;

  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (this.formProperty.properties.length === 0) {
      this.addItem();
    }
    const widget = this.formProperty.schema.widget;
    this.addButtonLabel = widget && widget.addButtonLabel
      ? widget.addButtonLabel : 'Add';
    if (widget.noTableLabel) {
      this.noTableLabel = widget.noTableLabel;
    }
    if (widget.noCollapseButton) {
      this.noCollapseButton = widget.noCollapseButton;
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
    return Util.isVisible(this.formProperty.properties[0], propertyId);
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
