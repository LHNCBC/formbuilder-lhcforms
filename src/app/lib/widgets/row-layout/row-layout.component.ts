/**
 * For layout of fields in rows. Field width could be entire 12 columns (bootstrap grid size),
 * in which case next field starts on next line.
 */
import {Component, inject, OnInit} from '@angular/core';
import {GridComponent} from '../grid.component/grid.component';
import {faAngleDown, faAngleUp} from '@fortawesome/free-solid-svg-icons';
import {FormService} from '../../../services/form.service';

@Component({
  standalone: false,
  selector: 'lfb-row-layout',
  template: `
    <div *ngFor="let row of basicRows">
      <div [class]="gridClass(field)" class="lfb-row" [ngClass]="{hideRow: isHidden(field)}" *ngFor="let field of getShowFields(row)">
        <lfb-form-element [formProperty]="getShowFieldProperty(field)"></lfb-form-element>
      </div>
    </div>
    <div class="d-flex pt-3">
      <button type="button" class="btn btn-link text-decoration-none ps-0 fw-bold" (click)="collapse.toggle()"
              [attr.aria-expanded]="!collapseAdvanced"
              aria-controls="advancedFields"
        >Advanced fields <fa-icon [icon]="collapseAdvanced ? faDown : faUp" aria-hidden="true"></fa-icon>
      </button>
    </div>
    <div #collapse="ngbCollapse" [(ngbCollapse)]="collapseAdvanced" (ngbCollapseChange)="handleAdvPanelCollapse($event)" id="advancedFields">
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

  widgetId: string;
  basicRows: any = [];
  advancedRows: any = [];

  collapseAdvanced = true;
  faUp = faAngleUp;
  faDown = faAngleDown;
  formService = inject(FormService);


  /**
   * Initialize
   */
  ngOnInit() {
    this.widgetId = this.formProperty.schema.formLayout.targetPage;
    // Read rows from schema layout
    this.basicRows = this.formProperty.schema.formLayout.basic;
    this.advancedRows = this.formProperty.schema.formLayout.advanced;
    this.collapseAdvanced = (this.formService.isFocusNodeHasError()) ? false : !!this.formService[this.widgetId];
  }

  /**
   * Handle advance panel collapse/expand button.
   */
  handleAdvPanelCollapse(event: boolean) {
    this.collapseAdvanced = event;
    if(this.widgetId in this.formService) {
      this.formService[this.widgetId] = event;
    }
  }

  /**
   * Check to see if it is a hidden field. Intended to apply hideRow class.
   * @param field - Field id.
   */
  isHidden(field): boolean {
    return this.getWidgetId(field) === 'hidden';
  }
}
