import { ViewChild, Component, inject, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogClose, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { FormService } from 'src/app/services/form.service';
import { FormProperty, ISchema } from '@lhncbc/ngx-schema-form';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { ValueSetResourceComponent } from '../value-set-resource/value-set-resource.component';
import fhir from 'fhir/r4';
import {MessageDlgComponent} from "../message-dlg/message-dlg.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

/**
 * Define the data structure for the dialog input.
 */
export interface ResourceData {
  formProperty?: FormProperty | null,
  resourceType?: 'ValueSet' | 'Binary' | null,
  options?: any;
  indexInContained?: number;
}


@Component({
  selector: 'lfb-resource-dlg',
  imports: [MatDialogTitle, MatDialogContent, MatIconButton, MatDialogActions, MatIconModule, MatTabsModule, MatTooltip, ValueSetResourceComponent],
  templateUrl: './resource-dlg.component.html',
  styles: [`
    .close-button {
      float: right;
    }
  `]
})
export class ResourceDlgComponent {
  input: fhir.Resource;
  changedValue: fhir.Resource;
  resourceType: 'ValueSet' | 'Binary' = 'ValueSet';
  schema: ISchema;

  @ViewChild('vsForm', {read: ValueSetResourceComponent}) vsForm: ValueSetResourceComponent;
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;

  data = inject<ResourceData>(MAT_DIALOG_DATA);
  matDialogRef = inject(MatDialogRef<ResourceDlgComponent>);
  formService: FormService = inject(FormService);
  ngbModalService: NgbModal = inject(NgbModal);

  constructor() {
    this.input = this.data.formProperty?.value;
    this.changedValue = this.input;
      this.resourceType = this.data.formProperty?.schema.properties.resourceType?.enum[0] || this.data.resourceType || this.resourceType;
    this.schema = this.formService.getResourceSchema(this.resourceType);
  }


  /**
   * Handle the dialog save and close event.
   */
  save() {
    if(this.resourceType === 'ValueSet') {
      if(this.vsForm.emptyId) {
        this.alertErrors('Please enter a value for Id before saving the resource.');
        return;
      }
      else if(this.vsForm.hasErrors()) {
        this.alertErrors('There are errors in the form. Please correct them before closing.');
        return;
      }
      this.changedValue['date'] = new Date().toISOString();
    }
    this.matDialogRef.close(this.changedValue);
  }

  /**
   * Get the input value as a ValueSet.
   */
  get inputValueSet() {
    return this.input as fhir.ValueSet;
  }


  /**
   * Handle the ValueSet change event.
   * @param event - The ValueSet object that has changed.
   */
  onValueSetChanged(event: fhir.ValueSet) {
    this.changedValue = event;
  }

  /**
   * Handle the cancel button event.
   */
  cancel() {
    // Check if the form is dirty
    const isDirty = !!this.dlgContent.nativeElement.querySelector('.ng-dirty');
    if (!isDirty) {
      this.matDialogRef.close(false);
      return;
    } else {
      const modalRef = this.ngbModalService.open(MessageDlgComponent, {scrollable: true});
      modalRef.componentInstance.options = {
        title: 'Confirm',
        message: 'Are you sure you want to discard the changes you made?',
        type: 'warning',
        buttons: [{
          label: 'Discard changes',
          value: 'yes'
        }, {
          label:  'Do not discard changes',
          value: 'no'
        }]};

      modalRef.closed.subscribe((result) => {
        if (result === 'yes') {
          this.matDialogRef.close(false);
        }
      });
    }
  }

  /**
   * Alert the user with a message dialog for errors.
   * @param message - The error message to display.
   */
  alertErrors(message: string) {
    const modalRef = this.ngbModalService.open(MessageDlgComponent, {scrollable: true});
    modalRef.componentInstance.options = {
      title: 'Fix errors',
      message,
      type: 'error',
      buttons: [{
        label: 'OK',
        value: 'ok'
      }]
    };
    return modalRef;
  }
}
