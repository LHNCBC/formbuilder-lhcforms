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
import {MessageDlgComponent, MessageDlgOptions, MessageType} from "../message-dlg/message-dlg.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {hasUsageContextLocalReference} from '../usage-context/usage-context-reference.util';
import type {UsageContextEditModel} from '../usage-context/usage-context.types';
import {hasTemplateExtractReference} from '../template-extract/template-extract.util';
import {SharedObjectService} from '../../../services/shared-object.service';
import {Util} from '../../util';

/**
 * Define the data structure for the dialog input.
 */
export interface ResourceData {
  formProperty?: FormProperty | null,
  resourceType?: string | null,
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
  resourceType = 'ValueSet';
  schema: ISchema;

  @ViewChild('vsForm', {read: ValueSetResourceComponent}) vsForm: ValueSetResourceComponent;
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;

  data = inject<ResourceData>(MAT_DIALOG_DATA);
  matDialogRef = inject(MatDialogRef<ResourceDlgComponent>);
  formService: FormService = inject(FormService);
  ngbModalService: NgbModal = inject(NgbModal);
  private sharedObjectService = inject(SharedObjectService);
  private readonly originalResourceId: string | undefined;

  /**
   * Initialize the edited resource and its original id. The resource type comes from the
   * resource itself, then the form property schema, then the dialog data, then 'ValueSet';
   * it selects the editor schema.
   */
  constructor() {
    this.input = this.data.formProperty?.value;
    this.changedValue = this.input;
    this.originalResourceId = this.input?.id;
    this.resourceType = this.data.formProperty?.value?.resourceType ||
      this.data.formProperty?.schema.properties.resourceType?.enum?.[0] ||
      this.data.resourceType ||
      this.resourceType;
    this.schema = this.formService.getResourceSchema(this.resourceType);
  }

  /**
   * Serialize a clean copy of the resource for the read-only JSON viewer.
   *
   * @returns Pretty-printed JSON without Form Builder's internal __$ fields. Resources other
   *   than ValueSets are otherwise unchanged.
   */
  get resourceJson(): string {
    return JSON.stringify(Util.convertContainedResourceToJSON(this.input), null, 2);
  }


  /**
   * Handle the dialog save and close event. For a ValueSet, block saving when the id is
   * empty, the form has errors, or the id of a resource referenced by Usage Context or
   * template-based extraction was changed.
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
      else if(this.isReferencedResourceIdChanged()) {
        const referenceType = this.isReferencedByUsageContext() ? 'Usage Context' : 'Template-based extraction';
        this.alertErrors(
          `Id cannot be changed because ${referenceType} references #${this.originalResourceId}.`
        );
        return;
      }
      this.changedValue['date'] = new Date().toISOString();
    }
    this.matDialogRef.close(this.changedValue);
  }

  /**
   * Check whether an edited id would break a local Usage Context or template-based
   * extraction reference.
   *
   * @returns True when the original id is referenced and the edited id differs.
   */
  private isReferencedResourceIdChanged(): boolean {
    if(!this.data.formProperty || this.changedValue?.id === this.originalResourceId) {
      return false;
    }
    return this.isReferencedByUsageContext() || this.isReferencedByTemplateExtraction();
  }

  /**
   * Check whether Usage Context targets the original contained resource id.
   *
   * @returns True when a Usage Context valueReference targets the original id.
   */
  private isReferencedByUsageContext(): boolean {
    const usageContexts = this.data.formProperty.findRoot()
      ?.getProperty('useContext')
      ?.value as UsageContextEditModel[] | undefined;
    return hasUsageContextLocalReference(usageContexts, this.originalResourceId);
  }

  /**
   * Check whether template-based extraction targets the original contained resource id,
   * at the Questionnaire root or on any item. Contained resources are edited from the
   * form-level editor, whose model excludes items, so items are read from the current
   * Questionnaire.
   *
   * @returns True when a templateExtract extension references the original id.
   */
  private isReferencedByTemplateExtraction(): boolean {
    return hasTemplateExtractReference(
      this.sharedObjectService.composeQuestionnaire(this.data.formProperty.findRoot()?.value),
      this.originalResourceId
    );
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
      const options: MessageDlgOptions = {
        title: 'Confirm',
        message: 'Are you sure you want to discard the changes you made?',
        type: MessageType.INFO,
        buttons: [{
          label: 'Discard changes',
          value: 'yes'
        }, {
          label:  'Do not discard changes',
          value: 'no'
        }]};
      modalRef.componentInstance.options = options;

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
    const options: MessageDlgOptions = {
      title: 'Fix errors',
      message,
      type: MessageType.DANGER,
      buttons: [{
        label: 'OK',
        value: 'ok'
      }]
    };
    modalRef.componentInstance.options = options;
    return modalRef;
  }
}
