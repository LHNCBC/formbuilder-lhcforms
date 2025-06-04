import { AfterViewInit, Component, DoCheck, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LfbArrayWidgetComponent } from '../lfb-array-widget/lfb-array-widget.component';
import { TableComponent } from '../table/table.component';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SchemaFormModule, FormProperty } from '@lhncbc/ngx-schema-form';
import { AppFormElementComponent } from '../form-element/form-element.component';
import { LabelComponent } from '../label/label.component';
import { TitleComponent } from '../title/title.component';
import { BooleanControlledComponent } from '../boolean-controlled/boolean-controlled.component';
import { ResourceDlgComponent, ResourceData } from '../resource-dlg/resource-dlg.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';


@Component({
  selector: 'lfb-contained',
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
    MatDialogModule
  ],
  templateUrl: '../table/table.component.html',
  styleUrl: '../table/table.component.css',
  styles: [`
    lfb-contained .col-sm-half {
      width: 8.16667% !important;
      flex: 0 0  8.16667% !important;
      max-width: 8.16667% !important;
    }
  `]
})
export class ContainedComponent extends TableComponent implements OnInit, AfterViewInit, DoCheck {

  matDialogService: MatDialog = inject(MatDialog);

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    const rows = this.formProperty.properties.length;
    super.ngOnInit();
    if (rows === 0) {
      // Table component adds a row by default for the user to enter first row.
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
  onEditProperty(index: number) {
    const formProperty = this.formProperty.properties[index];
    const resourceType = formProperty.schema.properties.resourceType.enum[0];
    const matDialogRef = this.openDialog({
      formProperty,
      resourceType,
      indexInContained: index
    });

    const sub = matDialogRef.afterClosed().subscribe((resourceValue) => {
      if (resourceValue) {
        formProperty.setValue(resourceValue, false);
      }
      sub.unsubscribe();
    });
  }

  /**
   * Override the addItem method to open a dialog for adding a new resource.
   */
  addItemWithAlert(popover): void {
    const matDialogRef = this.openDialog({resourceType: 'ValueSet'});
    const sub = matDialogRef.afterClosed().subscribe((resourceValue) => {
      if(resourceValue) {
        this.formProperty.addItem(resourceValue);
      }
      sub.unsubscribe();
    });
  }

  /**
   * Open the dialog to edit the resource.
   * @param resourceProp - Resource data to be passed to the dialog.
   * @returns MatDialogRef - Reference to the opened dialog.
   */
  openDialog(resourceProp: ResourceData) {
    const matDialogRef = this.matDialogService.open(ResourceDlgComponent, {
      data: resourceProp,
      width: '80vw',
      height: '80vh',
      disableClose: true,
      closeOnNavigation: false
    });
    return matDialogRef;
  }

}
