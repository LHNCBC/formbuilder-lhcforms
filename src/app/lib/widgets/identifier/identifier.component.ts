import {
  AfterViewInit,
  Component,
  OnInit,
} from '@angular/core';
import {IdentifierDlgComponent} from "../identifier-dlg/identifier-dlg.component";
import {TableEditRowInDlgComponent} from "../table-edit-row-in-dlg/table-edit-row-in-dlg.component";
import {AppFormElementComponent} from "../form-element/form-element.component";
import {BooleanControlledComponent} from "../boolean-controlled/boolean-controlled.component";
import {LabelComponent} from "../label/label.component";
import {TitleComponent} from "../title/title.component";
import {
  FormProperty,
  SchemaFormModule
} from "@lhncbc/ngx-schema-form";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {MatDialogModule} from "@angular/material/dialog";
import {MatTooltip} from "@angular/material/tooltip";
import {IsDisabledPipe} from "../../pipes/is-disabled.pipe";

/**
 * A component to edit FHIR identifiers as a table with each row representing an identifier.
 * Each row is edited in a dialog.
 */
@Component({
  standalone: true,
  selector: 'lfb-identifier',
  imports: [
    AppFormElementComponent,
    BooleanControlledComponent,
    LabelComponent,
    TitleComponent,
    SchemaFormModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    FontAwesomeModule,
    NgbModule,
    MatDialogModule,
    MatTooltip,
    IsDisabledPipe
  ],
  templateUrl: '../table/table.component.html',
  styleUrl: '../table/table.component.css',
})
export class IdentifierComponent extends TableEditRowInDlgComponent implements OnInit, AfterViewInit {
  private summaryFields = new Set(['type', 'period', 'assigner', 'use']);

  /**
   * Create the identifier table component and configure its edit dialog.
   */
  constructor() {
    super();
    this.dialogComponentType = IdentifierDlgComponent;
  }

  /**
   * Initialize identifier widget behavior and inherited table settings.
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.addEditAction = true;
  }

  /**
   * Finalize view initialization for dialog-backed table interactions.
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  /**
   * Determine whether a column should render as display-only summary text.
   *
   * @param showField - Table field definition from widget.showFields.
   * @returns True when the field should use display renderer; otherwise false.
   */
  useDisplayRenderer(showField: any): boolean {
    return this.summaryFields.has(showField?.field);
  }

  /**
   * Build the display text shown in read-only summary columns.
   *
   * @param itemProperty - Form property for the current table row.
   * @param showField - Table field definition for the current column.
   * @returns A compact JSON/text summary for the cell value.
   */
  getDisplayValue(itemProperty: FormProperty, showField: any): string {
    const value = this.getProperty(itemProperty, showField?.field)?.value;
    return this.compactJson(value);
  }

  /**
   * Convert an arbitrary value to a compact one-line display string.
   *
   * @param value - Raw value from the form model.
   * @returns Compact JSON/text representation, or empty string when no meaningful value exists.
   */
  private compactJson(value: any): string {
    const cleaned = this.removeEmpty(value);
    if (cleaned === null || cleaned === undefined || cleaned === '') {
      return '';
    }
    if (typeof cleaned === 'string') {
      return cleaned;
    }
    if (typeof cleaned !== 'object') {
      return String(cleaned);
    }
    return JSON.stringify(cleaned);
  }

  /**
   * Recursively remove null/undefined/empty-string values from an object or array.
   *
   * @param value - Value to normalize.
   * @returns Normalized value with empty branches removed.
   */
  private removeEmpty(value: any): any {
    if (Array.isArray(value)) {
      const items = value
        .map((item) => this.removeEmpty(item))
        .filter((item) => !this.isEmptyValue(item));
      return items.length ? items : undefined;
    }
    if (value && typeof value === 'object') {
      const ret: {[key: string]: any} = {};
      Object.keys(value).forEach((key) => {
        const cleaned = this.removeEmpty(value[key]);
        if (!this.isEmptyValue(cleaned)) {
          ret[key] = cleaned;
        }
      });
      return Object.keys(ret).length ? ret : undefined;
    }
    return value;
  }

  /**
   * Check whether a value should be treated as empty for summary rendering.
   *
   * @param value - Value to evaluate.
   * @returns True when value is null, undefined, or empty string.
   */
  private isEmptyValue(value: any): boolean {
    return value === null || value === undefined || value === '';
  }
}
