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

  @Input()
  dialogComponentType: ComponentType<unknown> = null;
  matDialogService: MatDialog = inject(MatDialog);

  constructor() {
    super();
  }

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    const rows = this.formProperty.properties.length;
    super.ngOnInit();
    if (rows === 0) {
      // Table component adds a row by default for the user to prompt entries.
      // In this component, the rows are in the dialog, so we don't want to add a row.
      this.removeProperty(0);
    }
  }

  /**
   * Ng DoCheck lifecycle hook. The cells in this component are all read only.
   * Use the hook to set the attribute on all the inputs.
   */
  ngDoCheck(): void {
    this.includeActionColumn = true;
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

    const sub = matDialogRef.afterClosed().subscribe((submittedValue) => {
      if (submittedValue) {
        this.formProperty.properties[index].setValue(submittedValue, false);
      }
      sub.unsubscribe();
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
    const sub = matDialogRef.afterClosed().subscribe((submittedValue) => {
      if(submittedValue) {
        this.addNewItem(submittedValue);
      }
      sub.unsubscribe();
    });
  }

  addNewItem(newValue: fhir.Extension) {
    this.formProperty.addItem(newValue);
  }

  /**
   * Open the dialog to edit the resource.
   * @param contentData - Data to pass to the dialog.
   * @param contentDlg - Component type to use as the dialog. Allows different dialog components to be used.
   * @returns MatDialogRef - Reference to the opened dialog.
   */
  openDialog(contentData: DialogData, contentDlg: ComponentType<unknown>) {
    let dPosition: DialogPosition = null;
    const previousDialogRef = this.matDialogService.openDialogs?.reverse().find((dRef) => {
      return dRef.componentInstance instanceof contentDlg;
    });
    if(previousDialogRef) {
      const position= previousDialogRef.componentInstance?.dlgContainer?.nativeElement.getBoundingClientRect();
      dPosition = {top: position.top + 20 + 'px', left: position.left + 20 + 'px'};
    }
    return this.matDialogService.open(contentDlg, {
      data: contentData,
      width: '80vw',
      height: '80vh',
      position: dPosition,
      disableClose: true,
      closeOnNavigation: false
    });
  }
}
