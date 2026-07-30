import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTooltip} from '@angular/material/tooltip';
import {FormProperty, ObjectProperty, SchemaFormModule} from '@lhncbc/ngx-schema-form';
import {AppFormElementComponent} from '../form-element/form-element.component';
import {BooleanControlledComponent} from '../boolean-controlled/boolean-controlled.component';
import {LabelComponent} from '../label/label.component';
import {TitleComponent} from '../title/title.component';
import {TableEditRowInDlgComponent} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {UsageContextDlgComponent} from '../usage-context-dlg/usage-context-dlg.component';
import {IsDisabledPipe} from '../../pipes/is-disabled.pipe';
import type {UsageContextEditModel, UsageContextTableField} from './usage-context.types';
import {take} from 'rxjs/operators';

/**
 * Table editor for Questionnaire.useContext.
 */
@Component({
  selector: 'lfb-usage-context',
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
  styleUrl: '../table/table.component.css'
})
export class UsageContextComponent extends TableEditRowInDlgComponent implements OnInit, AfterViewInit, OnDestroy {
  private updatingSummaries = false;
  private readonly valueSummaryField = '__$valueSummary';

  constructor() {
    super();
    this.dialogComponentType = UsageContextDlgComponent;
  }

  /**
   * Initialize the table without adding an empty UsageContext row.
   */
  ngOnInit() {
    this.addDefaultItemIfEmpty = false;
    this.updateValueSummaries();
    super.ngOnInit();
  }

  /**
   * Subscribe to row changes so the display summary column stays current.
   */
  override ngAfterViewInit() {
    super.ngAfterViewInit();
    const sub = this.formProperty.valueChanges.subscribe(() => {
      this.updateValueSummaries();
    });
    this.subscriptions.push(sub);
  }

  /**
   * Open the UsageContext dialog for an existing table row.
   *
   * @param index - Index of the row to edit.
   */
  override onEditProperty(index: number) {
    const matDialogRef = this.openDialog({
      arrayProperty: this.formProperty,
      rowIndex: index,
      title: 'Usage Context'
    }, this.dialogComponentType);

    matDialogRef.afterClosed().pipe(take(1)).subscribe((submittedValue: UsageContextEditModel | false | undefined) => {
      if (submittedValue) {
        this.formProperty.properties[index].reset(submittedValue, false);
        this.updateValueSummaries();
      }
    });
  }

  /**
   * Open the UsageContext dialog to add a new row.
   *
   * @param popover - Optional popover trigger passed by the base table widget.
   */
  override addItemWithAlert(_popover: unknown): void {
    const matDialogRef = this.openDialog({
        arrayProperty: this.formProperty,
        rowIndex: -1
      },
      this.dialogComponentType);
    matDialogRef.afterClosed().pipe(take(1)).subscribe((submittedValue: UsageContextEditModel | false | undefined) => {
      if(submittedValue) {
        this.formProperty.addItem(submittedValue);
        this.updateValueSummaries();
      }
    });
  }

  /**
   * Check whether the table field should be visible.
   *
   * @param propertyId - Field id from the row schema.
   * @returns True when the field should be rendered.
   */
  override isVisible(propertyId: string): boolean {
    if(propertyId === this.valueSummaryField) {
      return true;
    }
    return super.isVisible(propertyId);
  }

  /**
   * Check whether a field should use the table display renderer.
   *
   * @param showField - Field display configuration from the table widget.
   * @returns True when the value summary renderer should be used.
   */
  override useDisplayRenderer(showField: UsageContextTableField): boolean {
    return showField?.field === this.valueSummaryField;
  }

  /**
   * Get the display value for a table cell.
   *
   * @param itemProperty - Row form property.
   * @param showField - Field display configuration from the table widget.
   * @returns Display text for the requested table cell.
   */
  override getDisplayValue(itemProperty: FormProperty, showField: UsageContextTableField): string {
    if(showField?.field === this.valueSummaryField) {
      return this.getValueSummary(itemProperty.value);
    }
    return super.getDisplayValue(itemProperty, showField);
  }

  /**
   * Refresh cached UsageContext value summaries for every row.
   */
  private updateValueSummaries(): void {
    if(this.updatingSummaries) {
      return;
    }
    this.updatingSummaries = true;
    try {
      ((this.formProperty.properties || []) as ObjectProperty[]).forEach((rowProperty: ObjectProperty) => {
        const nextSummary = this.getValueSummary(rowProperty.value);
        const summaryProperty = rowProperty.getProperty('__$valueSummary');
        if(summaryProperty && summaryProperty.value !== nextSummary) {
          summaryProperty.setValue(nextSummary, false);
        }
      });
    }
    finally {
      this.updatingSummaries = false;
    }
  }

  /**
   * Build the summary text for the selected UsageContext value[x].
   *
   * @param value - UsageContext value to summarize.
   * @returns Human-readable summary for the selected value[x].
   */
  private getValueSummary(value: UsageContextEditModel): string {
    return UsageContextDlgComponent.getValueSummary(value);
  }
}
