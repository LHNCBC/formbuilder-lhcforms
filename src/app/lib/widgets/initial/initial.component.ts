import {AfterViewInit, Component, DoCheck, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTooltip} from '@angular/material/tooltip';
import {SchemaFormModule} from '@lhncbc/ngx-schema-form';
import {AppFormElementComponent} from '../form-element/form-element.component';
import {BooleanControlledComponent} from '../boolean-controlled/boolean-controlled.component';
import {LabelComponent} from '../label/label.component';
import {TitleComponent} from '../title/title.component';
import {IsDisabledPipe} from '../../pipes/is-disabled.pipe';
import {TableEditRowInDlgComponent} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {TableComponent} from '../table/table.component';
import {AttachmentDlgComponent} from '../attachment-dlg/attachment-dlg.component';
import {AttachmentUtil} from '../../attachment-util';

@Component({
  selector: 'lfb-table',
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
export class InitialComponent extends TableEditRowInDlgComponent implements OnInit, AfterViewInit, DoCheck {
  private static readonly ATTACHMENT_FIELDS = new Set([
    'valueAttachment.title',
    'valueAttachment.contentType',
    'valueAttachment.size',
    '__$stringify'
  ]);
  private attachmentType = false;

  /** Configure the inherited table editor to use the Attachment dialog. */
  constructor() {
    super();
    this.dialogComponentType = AttachmentDlgComponent;
  }

  /** Initialize the table behavior for Attachment and non-Attachment initial values. */
  override ngOnInit(): void {
    this.attachmentType = this.formProperty.findRoot().getProperty('type')?.value === 'attachment';
    this.addDefaultItemIfEmpty = !this.attachmentType;
    super.ngOnInit();
    if(!this.attachmentType && this.formProperty.properties.length === 0) {
      this.addItem();
    }
    this.updateAttachmentRows();
  }

  /** Watch item-type changes and update the table's Attachment-specific behavior. */
  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    const typeProperty = this.formProperty.findRoot().getProperty('type');
    if(typeProperty) {
      this.subscriptions.push(typeProperty.valueChanges.subscribe((type) => {
        this.attachmentType = type === 'attachment';
        this.addEditAction = this.attachmentType;
        this.updateAttachmentRows();
        this.cdr.markForCheck();
      }));
    }
  }

  /** Keep action columns and read-only fields consistent with the current item type. */
  override ngDoCheck(): void {
    this.addEditAction = this.attachmentType;
    if(this.attachmentType) {
      const repeats = this.formProperty.findRoot().getProperty('repeats')?.value;
      this.singleItem = repeats !== true && +this.formProperty.properties.length > 0;
      super.ngDoCheck();
      this.includeActionColumn = +this.formProperty.properties.length > 0;
      this.noHeader = false;
      const inputs = this.elementRef.nativeElement.querySelectorAll('input[readonly]');
      inputs.forEach((input: HTMLInputElement) => input.setAttribute('data-attachment-readonly', 'true'));
    }
    else {
      TableComponent.prototype.ngDoCheck.call(this);
      const inputs = this.elementRef.nativeElement.querySelectorAll('input[data-attachment-readonly]');
      inputs.forEach((input: HTMLInputElement) => {
        input.removeAttribute('readonly');
        input.removeAttribute('data-attachment-readonly');
      });
    }
  }

  /**
   * Add a row through the appropriate inherited workflow for the current item type.
   * @param popover - The maximum-cardinality warning popover.
   */
  override addItemWithAlert(popover): void {
    if(this.attachmentType) {
      super.addItemWithAlert(popover);
    }
    else {
      TableComponent.prototype.addItemWithAlert.call(this, popover);
    }
  }

  /**
   * Return the table columns relevant to the current initial-value type.
   * @returns The columns to display for the current item type.
   */
  override getShowTableFields(): any[] {
    const fields = super.getShowTableFields();
    return this.attachmentType
      ? fields.filter((field) => InitialComponent.ATTACHMENT_FIELDS.has(field.field))
      : fields;
  }

  /**
   * Open the Attachment editor for an existing initial-value row.
   * @param index - The row index to edit.
   */
  override onEditProperty(index: number): void {
    if(this.attachmentType) {
      const matDialogRef = this.openDialog({
        arrayProperty: this.formProperty,
        rowIndex: index
      }, this.dialogComponentType);
      const subscription = matDialogRef.afterClosed().subscribe((submittedValue) => {
        if(submittedValue) {
          const rows = [...(this.formProperty.value || [])];
          rows[index] = submittedValue;
          this.formProperty.setValue(rows, false);
        }
        subscription.unsubscribe();
      });
    }
  }

  /**
   * Add a new row with its Attachment display value populated.
   * @param newValue - The row returned by the edit dialog.
   */
  override addNewItem(newValue: any): void {
    super.addNewItem(this.withAttachmentDisplay(newValue));
  }

  /** Populate display strings for all Attachment rows when required. */
  private updateAttachmentRows(): void {
    if(!this.attachmentType) {
      return;
    }
    const rows = (this.formProperty.value || []).map((row) => this.withAttachmentDisplay(row));
    if(JSON.stringify(rows) !== JSON.stringify(this.formProperty.value || [])) {
      this.formProperty.setValue(rows, false);
    }
  }

  /**
   * Return a row with compact Attachment JSON for display in the table.
   * @param row - The initial-value row to prepare.
   * @returns The row with its Attachment display value populated, or the original row.
   */
  private withAttachmentDisplay(row: any): any {
    if(!row?.valueAttachment) {
      return row;
    }
    return {
      ...row,
      '__$stringify': AttachmentUtil.compactJson(row.valueAttachment)
    };
  }
}
