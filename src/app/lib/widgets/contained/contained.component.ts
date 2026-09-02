import { AfterViewInit, Component, DoCheck, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableAddMenuItem, TableComponent } from '../table/table.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {ArrayProperty, SchemaFormModule} from '@lhncbc/ngx-schema-form';
import { AppFormElementComponent } from '../form-element/form-element.component';
import { LabelComponent } from '../label/label.component';
import { TitleComponent } from '../title/title.component';
import { BooleanControlledComponent } from '../boolean-controlled/boolean-controlled.component';
import { ResourceDlgComponent, ResourceData } from '../resource-dlg/resource-dlg.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTooltip} from "@angular/material/tooltip";
import {IsDisabledPipe} from "../../pipes/is-disabled.pipe";
import {MessageType} from '../message-dlg/message-dlg.component';
import {hasUsageContextLocalReference} from '../usage-context/usage-context-reference.util';
import type {UsageContextEditModel} from '../usage-context/usage-context.types';
import {hasTemplateExtractReference} from '../template-extract/template-extract.util';
import {
  ContainedResourceService,
  PreparedContainedResource
} from '../../../services/contained-resource.service';
import {Util} from '../../util';
import {faEye} from '@fortawesome/free-solid-svg-icons';


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
    MatDialogModule,
    MatTooltip,
    IsDisabledPipe
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

  private readonly referencedResourceButtons = [{label: 'Close', value: 'close'}];
  private readonly containedResourceService = inject(ContainedResourceService);

  matDialogService: MatDialog = inject(MatDialog);
  faView = faEye;

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    this.addDefaultItemIfEmpty = false; // Avoid adding default row.
    this.addMenuItems = [
      {id: 'create-value-set', label: 'Create a ValueSet…'},
      {id: 'upload-file', label: 'Upload from a local file…'},
      {
        id: 'import-server',
        label: 'Import from a FHIR server…',
        disabled: true,
        title: 'FHIR server import will be added in a later release.'
      }
    ] satisfies TableAddMenuItem[];
    super.ngOnInit();
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
    const formProperty = this.formProperty.properties[index];
    const resourceType = formProperty?.getProperty('resourceType')?.value;
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
   * Render contained-resource columns as read-only summary values.
   *
   * @param showField - Configured table field.
   * @returns Always true because contained-resource rows are edited or viewed in a dialog.
   */
  override useDisplayRenderer(showField: any): boolean {
    return true;
  }

  /**
   * Keep every configured type-neutral summary column visible for all resource types.
   *
   * @param propertyId - Configured summary-field identifier.
   * @returns Always true because some summary fields are derived rather than schema properties.
   */
  override isVisible(propertyId: string): boolean {
    return true;
  }

  /**
   * Get a display value for a type-neutral contained-resource table column.
   *
   * @param itemProperty - Form property holding the contained resource.
   * @param showField - Configured table field.
   * @returns Human-readable cell value.
   */
  override getDisplayValue(itemProperty, showField: any): string {
    const resource = itemProperty?.value || {};
    switch(showField?.field) {
      case 'resourceType':
        return resource.resourceType || '';
      case 'id':
        return resource.id || '';
      case '__$resourceDisplay':
        return this.getResourceDisplay(resource);
      case '__$fhirVersionInfo.version': {
        const info = this.containedResourceService.getVersionInfo(resource);
        return info?.version || (info?.confidence === 'ambiguous' ? 'Ambiguous' : 'Unknown');
      }
      case 'status':
        return resource.status || '';
      default:
        return '';
    }
  }

  /**
   * Get an accurate action label for editable ValueSets and read-only opaque resources.
   *
   * @param index - Contained-resource row index.
   * @returns Row action label.
   */
  override getEditActionLabel(index: number): string {
    return this.formProperty?.properties[index]?.value?.resourceType === 'ValueSet'
      ? 'Edit this row'
      : 'View contained resource JSON';
  }

  /**
   * Use an eye icon for opaque resources and retain the edit icon for editable ValueSets.
   *
   * @param index - Contained-resource row index.
   * @returns View or edit action icon.
   */
  override getEditActionIcon(index: number) {
    return this.formProperty?.properties[index]?.value?.resourceType === 'ValueSet'
      ? this.faEdit
      : this.faView;
  }

  /**
   * Derive a short display string from common fields without assuming a resource-specific schema.
   *
   * @param resource - Contained FHIR resource.
   * @returns Short display text when one can be derived.
   */
  private getResourceDisplay(resource: any): string {
    for(const value of [resource.title, resource.name, resource.description, resource.url, resource.status]) {
      if(typeof value === 'string') {
        return value;
      }
    }
    const name = Array.isArray(resource.name) ? resource.name[0] : null;
    if(name) {
      return name.text || [...(name.given || []), name.family].filter(Boolean).join(' ');
    }
    return typeof resource.code?.text === 'string' ? resource.code.text : '';
  }

  /**
   * Prevent deletion from leaving a dangling local Usage Context reference.
   *
   * @param index - Index of the contained resource to delete.
   * @param message - Standard confirmation message used for unreferenced rows.
   */
  override confirmRemoveProperty(index: number, message = 'Are you sure you want to delete this row?'): void {
    const resourceId = this.formProperty?.properties?.[index]?.value?.id as string | undefined;
    if(this.isReferencedByUsageContext(resourceId)) {
      this.dialogService.showDialog(
        MessageType.WARNING,
        'Contained resource is in use',
        `The contained resource #${resourceId} is referenced by Usage Context and cannot be deleted.`,
        this.referencedResourceButtons
      );
      return;
    }
    if(this.isReferencedByTemplateExtraction(resourceId)) {
      this.dialogService.showDialog(
        MessageType.WARNING,
        'Contained resource is in use',
        `The contained resource #${resourceId} is referenced by Template-based extraction and cannot be deleted.`,
        this.referencedResourceButtons
      );
      return;
    }

    super.confirmRemoveProperty(index, message);
  }

  /**
   * Override the default add behavior to create a ValueSet in the existing resource editor.
   *
   * @param popover - Unused standard table popover reference.
   */
  addItemWithAlert(popover): void {
    const matDialogRef = this.openDialog({resourceType: 'ValueSet'});
    const sub = matDialogRef.afterClosed().subscribe((resourceValue) => {
      if(resourceValue) {
        this.containedResourceService.annotateEditorResource(resourceValue);
        this.formProperty.addItem(resourceValue);
      }
      sub.unsubscribe();
    });
  }

  /**
   * Handle a selection from the contained-resource Add menu.
   *
   * @param actionId - Selected action identifier.
   * @param popover - Standard table popover reference used by ValueSet creation.
   */
  override onAddMenuItem(actionId: string, popover): void {
    if(actionId === 'create-value-set') {
      this.addItemWithAlert(popover);
    }
    else if(actionId === 'upload-file') {
      this.openResourceFilePicker();
    }
  }

  /** Open a browser file picker for one local FHIR JSON resource. */
  openResourceFilePicker(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,application/fhir+json';
    input.addEventListener('change', (event) => void this.onResourceFileSelected(event));
    input.click();
  }

  /**
   * Parse, validate, and add a selected local FHIR resource file.
   *
   * @param event - Change event emitted by the temporary file input.
   */
  async onResourceFileSelected(event: Event): Promise<void> {
    const input = event?.target as HTMLInputElement;
    const file = input?.files?.[0];
    const selectedFile = Util.validateFile(file);
    if(!selectedFile) {
      this.showImportError(`Invalid file name: ${file?.name || ''}`);
      return;
    }

    try {
      const prepared = this.containedResourceService.prepareImportedResource(
        await selectedFile.text(),
        this.formProperty.value || [],
        selectedFile.type
      );
      if(await this.confirmNormalization(prepared)) {
        this.formProperty.addItem(prepared.resource);
      }
    }
    catch(error) {
      this.showImportError(error instanceof Error ? error.message : String(error));
    }
    finally {
      input.value = '';
    }
  }

  /**
   * Ask for confirmation when importing required a generated id or removal of prohibited metadata.
   *
   * @param prepared - Prepared resource and normalization details.
   * @returns True when the resource may be added.
   */
  private async confirmNormalization(prepared: PreparedContainedResource): Promise<boolean> {
    const changes: string[] = [];
    if(prepared.generatedId) {
      changes.push(`A contained id was generated: <strong>${prepared.resource.id}</strong>.`);
    }
    if(prepared.removedMetadata.length) {
      changes.push(`FHIR does not permit these fields on contained resources, so they will be removed: <strong>${prepared.removedMetadata.join(', ')}</strong>.`);
    }
    if(!changes.length) {
      return true;
    }

    const modalRef = this.dialogService.showDialog(
      MessageType.WARNING,
      'Normalize contained resource',
      `${changes.join('<p>')}</p><p>The source file will not be changed.</p>`,
      [{label: 'Cancel', value: 'cancel'}, {label: 'Import resource', value: 'import'}]
    );
    return modalRef.result.then((result) => result === 'import').catch(() => false);
  }

  /**
   * Show a contained-resource import error.
   *
   * @param message - Error message to display.
   */
  private showImportError(message: string): void {
    this.dialogService.showDialog(MessageType.DANGER, 'Unable to import contained resource', message);
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

  /**
   * Check if the edit button should be disabled for a given row.
   * @param arrayProperty - The ArrayProperty containing the rows.
   * @param index - Row index in the table.
   */
  _isDisabled(arrayProperty: ArrayProperty, index: number): boolean {
    return !arrayProperty?.properties[index]?.value?.resourceType;
  }

  override isDisabled = this._isDisabled.bind(this);

  /**
   * Check whether Usage Context currently targets a contained resource id.
   *
   * @param resourceId - Contained resource id.
   * @returns True when a Usage Context valueReference targets the resource.
   */
  private isReferencedByUsageContext(resourceId: string | undefined): boolean {
    const usageContexts = this.formProperty
      ?.findRoot()
      ?.getProperty('useContext')
      ?.value as UsageContextEditModel[] | undefined;
    return hasUsageContextLocalReference(usageContexts, resourceId);
  }

  /**
   * Check whether template-based extraction targets a contained resource id.
   *
   * @param resourceId - Contained resource id.
   * @returns True when a template extraction targets the resource.
   */
  private isReferencedByTemplateExtraction(resourceId: string | undefined): boolean {
    return hasTemplateExtractReference(this.formProperty?.findRoot()?.value, resourceId);
  }
}
