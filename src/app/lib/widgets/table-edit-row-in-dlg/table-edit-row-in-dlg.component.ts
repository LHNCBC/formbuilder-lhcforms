import {AfterViewInit, Component, DestroyRef, DoCheck, inject, Input, OnInit} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../table/table.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {ArrayProperty, FormProperty, PropertyGroup, SchemaFormModule} from '@lhncbc/ngx-schema-form';
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
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Util} from '../../util';
import {RawValueStoreService} from '../../../services/raw-value-store.service';

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

  @Input()
  dialogComponentType: ComponentType<unknown> = null;
  dialogOffsetPx = 20;
  matDialogService: MatDialog = inject(MatDialog);
  private rawValueStore = inject(RawValueStoreService);
  private destroyRef = inject(DestroyRef);

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
    this.includeActionColumn = true;
  }

  /**
   * Finish initialization after schema-form has materialized the array rows.
   */
  override ngAfterViewInit(): void {
    this.removeSyntheticEmptyRow();
    super.ngAfterViewInit();
  }

  /**
   * Remove an empty placeholder row from dialog-backed tables that start empty.
   */
  private removeSyntheticEmptyRow(): void {
    const props = this.formProperty?.properties || [];
    if(!this.addDefaultItemIfEmpty && props.length === 1 && Util.isEmpty(props[0]?.value)) {
      this.formProperty.removeItem(props[0]);
      this.cdr.markForCheck();
    }
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
        const rowProperty = this.formProperty.properties[index] as FormProperty;
        if(this.isIdentifierTable()) {
          // reset() emits synchronously, so make the complete value available
          // before parent dialogs recalculate their changed state.
          this.rawValueStore.setIdentifier(rowProperty, submittedValue as fhir.Identifier);
        }
        // Replace the full row model so deleted nested fields are not preserved.
        rowProperty.reset(submittedValue, false);
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
    if(this.isIdentifierTable() && newProperty) {
      this.rawValueStore.setIdentifier(newProperty, newValue as unknown as fhir.Identifier);
      // addItem() emits before it returns the new row. Emit again after seeding
      // the complete value so parent dialogs observe the committed Identifier.
      this.formProperty.updateValueAndValidity(false, true);
    }
  }

  /**
   * Check whether this table edits Identifier rows.
   *
   * @returns True for Identifier table widgets.
   */
  private isIdentifierTable(): boolean {
    return this.formProperty.schema?.widget?.id === 'identifier';
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
      pane.querySelector('.lfb-row-dialog')
    ) as HTMLElement[];
    const previousPanePosition = overlayPanes.length
      ? overlayPanes[overlayPanes.length - 1].getBoundingClientRect()
      : null;
    const previousDialogRef = this.matDialogService.openDialogs?.slice().reverse().find((dRef) =>
      !!dRef.componentInstance?.dlgContainer?.nativeElement
    );
    const position = previousPanePosition || previousDialogRef?.componentInstance?.dlgContainer?.nativeElement.getBoundingClientRect();
    if(position) {
      dPosition = this.getStackedDialogPosition(
        position,
        this.elementRef.nativeElement.ownerDocument
      );
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
      matDialogRef.afterOpened().pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        matDialogRef.updatePosition(dPosition);
      });
    }
    return matDialogRef;
  }

  /**
   * Offset a stacked dialog while keeping its full pane inside the viewport.
   *
   * @param previousPane - Bounding rectangle of the dialog beneath the new one.
   * @param ownerDocument - Document that owns the dialog overlay.
   * @returns Clamped top and left coordinates for MatDialog.
   */
  private getStackedDialogPosition(previousPane: DOMRect, ownerDocument: Document): DialogPosition {
    const viewport = ownerDocument.defaultView;
    const viewportWidth = viewport?.innerWidth || ownerDocument.documentElement.clientWidth;
    const viewportHeight = viewport?.innerHeight || ownerDocument.documentElement.clientHeight;
    const maxLeft = Math.max(0, viewportWidth - previousPane.width);
    const maxTop = Math.max(0, viewportHeight - previousPane.height);
    const left = Math.min(Math.max(0, previousPane.left + this.dialogOffsetPx), maxLeft);
    const top = Math.min(Math.max(0, previousPane.top + this.dialogOffsetPx), maxTop);
    return {top: `${top}px`, left: `${left}px`};
  }

}
