import {AfterViewInit, Component, DoCheck, inject, Input, OnInit} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../table/table.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {ArrayProperty, PropertyGroup, SchemaFormModule} from '@lhncbc/ngx-schema-form';
import { AppFormElementComponent } from '../form-element/form-element.component';
import { LabelComponent } from '../label/label.component';
import { TitleComponent } from '../title/title.component';
import { BooleanControlledComponent } from '../boolean-controlled/boolean-controlled.component';
import {DialogPosition, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatTooltip} from "@angular/material/tooltip";
import {ComponentType} from "@angular/cdk/portal";
import {IsDisabledPipe} from "../../pipes/is-disabled.pipe";
import fhir from "fhir/r4";
import {take} from 'rxjs/operators';
import {Util} from '../../util';

export interface DialogData {
  arrayProperty: ArrayProperty;
  rowIndex: number;
  [x: string ]: unknown;
}

/**
 * A table component to edit array items in a dialog.
 * Each row is read only and can be edited in a dialog.
 */
@Component({
  selector: 'lfb-table-edit-row-in-dlg',
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
  styles: [`
    lfb-table-edit-row-in-dlg .col-sm-half {
      width: 8.16667% !important;
      flex: 0 0  8.16667% !important;
      max-width: 8.16667% !important;
    }
  `]
})
export class TableEditRowInDlgComponent extends TableComponent implements OnInit, AfterViewInit, DoCheck {
  override includeActionColumn = true;
  private syntheticEmptyRowRemovalScheduled = false;

  @Input()
  dialogComponentType: ComponentType<unknown> = null;
  dialogOffsetPx = 20;
  matDialogService: MatDialog = inject(MatDialog);

  constructor() {
    super();
  }

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    this.addDefaultItemIfEmpty = false;
    super.ngOnInit();
    const widget = this.formProperty?.schema?.widget || {};
    this.labelPosition = this.labelPosition || widget.labelPosition || 'top';
    this.labelWidthClass = this.labelPosition === 'left'
      ? (this.labelWidthClass || widget.labelWidthClass || 'col-sm') : '';
    this.controlWidthClass = this.labelPosition === 'left'
      ? (this.controlWidthClass || widget.controlWidthClass || 'col-sm') : '';
    // Dialog row tables are always shown directly; avoid boolean-control toggles
    // that can flip template conditions during dev-mode double-check.
    this.booleanControlled = false;
    this.booleanControlledOption = false;
    this.scheduleSyntheticEmptyRowRemoval();
    this.includeActionColumn = true;
  }

  /**
   * Schedule cleanup of an empty placeholder row when the widget is configured to start empty.
   */
  private scheduleSyntheticEmptyRowRemoval(): void {
    if(this.syntheticEmptyRowRemovalScheduled) {
      return;
    }
    this.syntheticEmptyRowRemovalScheduled = true;
    setTimeout(() => {
      const props = this.formProperty?.properties || [];
      if(!this.addDefaultItemIfEmpty && props.length === 1 && Util.isEmpty(props[0]?.value)) {
        this.formProperty.removeItem(props[0]);
        this.cdr.markForCheck();
      }
      this.syntheticEmptyRowRemovalScheduled = false;
    });
  }

  /**
   * Ng DoCheck lifecycle hook. The cells in this component are all read only.
   * Use the hook to set the attribute on all the inputs.
   */
  ngDoCheck(): void {
    const inputs = this.elementRef.nativeElement.querySelectorAll("input");
    inputs.forEach((input) => {
      input.setAttribute("readonly", true);
    });
  }

  /**
   * Override the click handler on edit button.
   * @param index -  Index of the row in the table.
   */
  override onEditProperty(index: number) {
    const matDialogRef = this.openDialog({
      arrayProperty: this.formProperty,
      rowIndex: index
    }, this.dialogComponentType);

    matDialogRef.afterClosed().pipe(take(1)).subscribe((submittedValue) => {
      if (submittedValue) {
        // Replace the full row model so deleted nested fields are not preserved.
        this.formProperty.properties[index].reset(submittedValue, false);
        if(this.formProperty.schema?.widget?.id === 'identifier') {
          (this.formProperty.properties[index] as any).__lfbRawValue = JSON.parse(JSON.stringify(submittedValue));
        }
      }
    });
  }

  /**
   * Override the addItem method to open a dialog for adding a new resource.
   */
  override addItemWithAlert(popover): void {
    const matDialogRef = this.openDialog({
        arrayProperty: this.formProperty, rowIndex: -1
      },
      this.dialogComponentType);
    matDialogRef.afterClosed().pipe(take(1)).subscribe((submittedValue) => {
      if(submittedValue) {
        this.addNewItem(submittedValue);
      }
    });
  }

  /**
   * Add a new table row and preserve the raw identifier value for nested dialog editing.
   *
   * @param newValue - Value to add to the table.
   */
  addNewItem(newValue: fhir.Extension) {
    const newProperty = this.formProperty.addItem(newValue);
    if(this.formProperty.schema?.widget?.id === 'identifier' && newProperty) {
      (newProperty as any).__lfbRawValue = JSON.parse(JSON.stringify(newValue));
    }
  }

  /**
   * Open the dialog to edit the resource.
   * @param contentData - Data to pass to the dialog.
   * @param contentDlg - Component type to use as the dialog. Allows different dialog components to be used.
   * @returns MatDialogRef - Reference to the opened dialog.
   */
  openDialog(contentData: DialogData, contentDlg: ComponentType<unknown>) {
    let dPosition: DialogPosition = null;
    const overlayPanes = Array.from(
      this.elementRef.nativeElement.ownerDocument.querySelectorAll('.cdk-overlay-pane')
    ).filter((pane: Element) =>
      pane.querySelector('lfb-extension-dlg, lfb-identifier-dlg, lfb-usage-context-dlg')
    ) as HTMLElement[];
    const previousPanePosition = overlayPanes.length
      ? overlayPanes[overlayPanes.length - 1].getBoundingClientRect()
      : null;
    const previousDialogRef = this.matDialogService.openDialogs?.slice().reverse().find((dRef) =>
      !!dRef.componentInstance?.dlgContainer?.nativeElement
    );
    const position = previousPanePosition || previousDialogRef?.componentInstance?.dlgContainer?.nativeElement.getBoundingClientRect();
    if(position) {
      dPosition = {top: position.top + this.dialogOffsetPx + 'px', left: position.left + this.dialogOffsetPx + 'px'};
    }
    const matDialogRef = this.matDialogService.open(contentDlg, {
      data: contentData,
      width: '80vw',
      height: '80vh',
      position: dPosition,
      disableClose: true,
      closeOnNavigation: false
    });
    if(dPosition) {
      matDialogRef.updatePosition(dPosition);
      setTimeout(() => matDialogRef.updatePosition(dPosition));
    }
    return matDialogRef;
  }
}
