/**
 * For layout of fields in rows. Field width could be entire 12 columns (bootstrap grid size),
 * in which case next field starts on next line.
 */
import { Component, OnInit } from '@angular/core';
import { GridComponent} from '../grid.component/grid.component';
import {faAngleDown, faAngleRight} from '@fortawesome/free-solid-svg-icons';
import {faAngleUp} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lfb-row-layout',
  template: `
    <div *ngFor="let row of basicRows">
      <div [class]="gridClass(field)" class="lfb-row" [ngClass]="{hideRow: isHidden(field)}" *ngFor="let field of getShowFields(row)">
        <lfb-form-element [formProperty]="getShowFieldProperty(field)"></lfb-form-element>
      </div>
    </div>
    <div class="d-flex pt-3">
      <button class="btn btn-link text-decoration-none pl-0 font-weight-bold" (click)="collapse.toggle()"
        >Advanced fields <fa-icon [icon]="collapseAdvanced ? faDown : faUp" aria-hidden="true"></fa-icon>
      </button>
    </div>
    <div #collapse="ngbCollapse" [(ngbCollapse)]="collapseAdvanced">
      <hr>
      <div *ngFor="let row of advancedRows">
        <div [class]="gridClass(field)" class="lfb-row" [ngClass]="{hideRow: isHidden(field)}" *ngFor="let field of getShowFields(row)">
          <lfb-form-element [formProperty]="getShowFieldProperty(field)"></lfb-form-element>
        </div>
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
      display: none;
    }
  `]
})
export class RowLayoutComponent extends GridComponent implements OnInit {

  basicRows: any = [];
  advancedRows: any = [];

  collapseAdvanced = true;
  faUp = faAngleUp;
  faDown = faAngleDown;
  /**
   * Initialize
   */
  ngOnInit() {
    // Read rows from schema layout
    this.basicRows = this.formProperty.schema.layout.formLayout.basic;
    this.advancedRows = this.formProperty.schema.layout.formLayout.advanced;
  }

  /**
   * Check to see if it is a hidden field. Intended to apply hideRow class.
   * @param field - Field id.
   */
  isHidden(field): boolean {
    return this.getWidgetId(field) === 'hidden';
  }
}
