import { AfterViewInit, Component, DoCheck, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableAddMenuItem, TableComponent } from '../table/table.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
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
  DuplicateContainedResourceIdError,
  PreparedContainedResource
} from '../../../services/contained-resource.service';
import {SharedObjectService} from '../../../services/shared-object.service';
import {Util} from '../../util';
import {faEye} from '@fortawesome/free-solid-svg-icons';
import {FhirServersDlgComponent} from '../fhir-servers-dlg/fhir-servers-dlg.component';
import {
  FhirResourceSelection,
  FhirSearchDlgComponent
} from '../fhir-search-dlg/fhir-search-dlg.component';
import {FhirService} from '../../../services/fhir.service';
import {firstValueFrom} from 'rxjs';
import fhir from 'fhir/r4';
import {getContainedResourceDisplay} from './contained-resource-display.util';


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
  private readonly modalService = inject(NgbModal);
  private readonly fhirService = inject(FhirService);
  private readonly sharedObjectService = inject(SharedObjectService);

  matDialogService: MatDialog = inject(MatDialog);
  faView = faEye;

  /**
   * Ng OnInit lifecycle hook. Configure the Add menu choices (create a ValueSet, upload
   * a file, or import from a FHIR server) and suppress the default empty row.
   */
  ngOnInit() {
    this.addDefaultItemIfEmpty = false; // Avoid adding default row.
    this.addMenuItems = [
      {id: 'create-value-set', label: 'Create a ValueSet…'},
      {id: 'upload-file', label: 'Upload from a local file…'},
      {
        id: 'import-server',
        label: 'Import from a FHIR server…'
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
        return getContainedResourceDisplay(resource);
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
   * Prevent deletion from leaving a dangling local reference, e.g. from Usage Context,
   * template-based extraction, an answerValueSet, an extension's valueReference, or another
   * contained resource. Referenced rows show a warning instead of the confirmation.
   *
   * @param index - Index of the contained resource to delete.
   * @param message - Standard confirmation message used for unreferenced rows.
   */
  override confirmRemoveProperty(index: number, message = 'Are you sure you want to delete this row?'): void {
    const resourceId = this.formProperty?.properties?.[index]?.value?.id as string | undefined;
    if(this.isReferencedByUsageContext(resourceId)) {
      this.showReferencedResourceWarning(
        `The contained resource #${resourceId} is referenced by Usage Context and cannot be deleted.`
      );
      return;
    }
    if(this.isReferencedByTemplateExtraction(resourceId)) {
      this.showReferencedResourceWarning(
        `The contained resource #${resourceId} is referenced by Template-based extraction and cannot be deleted.`
      );
      return;
    }
    const referencePath = this.findLocalReferencePath(resourceId);
    if(referencePath) {
      this.showReferencedResourceWarning(
        `The contained resource #${resourceId} is referenced at ` +
        `${this.containedResourceService.escapeHtml(referencePath)} and cannot be deleted.`
      );
      return;
    }

    super.confirmRemoveProperty(index, message);
  }

  /**
   * Explain why a referenced contained resource cannot be deleted.
   *
   * @param message - HTML message; values from the Questionnaire must already be escaped.
   */
  private showReferencedResourceWarning(message: string): void {
    this.dialogService.showDialog(
      MessageType.WARNING,
      'Contained resource is in use',
      message,
      this.referencedResourceButtons
    );
  }

  /**
   * Override the default add behavior to create a ValueSet in the existing resource editor.
   * The saved ValueSet is marked as an internal R5 resource before it is added.
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
    else if(actionId === 'import-server') {
      void this.importResourceFromFHIRServer();
    }
  }

  /**
   * Select a FHIR server and import one searched resource into Questionnaire.contained.
   * The server dialogs change the shared FHIR server, which is also where the questionnaire
   * is saved, so the original server is restored afterwards, whether or not a resource
   * was imported.
   */
  private async importResourceFromFHIRServer(): Promise<void> {
    const originalServer = this.fhirService.getFhirServer();
    try {
      const serverSelected = await this.modalService
        .open(FhirServersDlgComponent, {size: 'lg'})
        .result
        .catch(() => false);
      if(!serverSelected) {
        return;
      }

      const searchModal = this.modalService.open(FhirSearchDlgComponent, {
        size: 'lg',
        scrollable: true
      });
      searchModal.componentInstance.configureForContainedResourceImport();
      const selection = await searchModal.result.catch(() => false) as FhirResourceSelection | false;
      if(!selection) {
        return;
      }

      const sourceVersion = this.fhirService.getFhirServer().version;
      const resource = await firstValueFrom(
        this.fhirService.readResource(selection.resourceType, selection.id)
      );
      await this.importResource(resource, '', sourceVersion);
    }
    catch(error) {
      this.showImportError(error instanceof Error ? error.message : String(error));
    }
    finally {
      if(this.fhirService.getFhirServer() !== originalServer) {
        this.fhirService.setFhirServer(originalServer);
      }
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
      await this.importResource(await selectedFile.text(), selectedFile.type);
    }
    catch(error) {
      this.showImportError(error instanceof Error ? error.message : String(error));
    }
    finally {
      input.value = '';
    }
  }

  /**
   * Validate an imported resource and add it, or, when a resource of the same type already
   * uses its id, replace that resource's contents after confirmation. Replacing keeps the id,
   * so Usage Context and template-based extraction references stay valid.
   *
   * @param input - JSON file contents or a resource read from a FHIR server.
   * @param contentType - Browser-provided file MIME type, when available.
   * @param serverVersion - Known version of the source FHIR server, when applicable.
   * @throws Error when the resource is invalid, or its id is used by a resource of another type.
   */
  private async importResource(
    input: string | fhir.Resource,
    contentType = '',
    serverVersion?: string
  ): Promise<void> {
    const existingResources: fhir.Resource[] = this.formProperty.value || [];
    let replaceIndex = -1;
    let prepared: PreparedContainedResource;
    try {
      prepared = this.containedResourceService.prepareImportedResource(
        input, existingResources, contentType, serverVersion
      );
    }
    catch(error) {
      if(!(error instanceof DuplicateContainedResourceIdError)) {
        throw error;
      }
      replaceIndex = error.existingIndex;
      // Validate against the other resources, as if the matching one were already removed.
      prepared = this.containedResourceService.prepareImportedResource(
        input,
        existingResources.filter((_resource, index) => index !== replaceIndex),
        contentType,
        serverVersion
      );
      const existingType = existingResources[replaceIndex].resourceType;
      if(existingType !== prepared.resource.resourceType) {
        throw new Error(
          `A contained ${existingType} with id "${error.resourceId}" already exists. ` +
          `It can only be replaced by a ${existingType} resource.`
        );
      }
      if(!await this.confirmReplacement(existingType, error.resourceId)) {
        return;
      }
    }

    if(!await this.confirmNormalization(prepared)) {
      return;
    }
    if(replaceIndex < 0) {
      this.formProperty.addItem(prepared.resource);
    }
    else {
      // Reset the array so the row is rebuilt; resetting the row object would keep fields
      // that are absent from the new contents.
      const resources = [...existingResources];
      resources[replaceIndex] = prepared.resource;
      this.formProperty.reset(resources, false);
    }
  }

  /**
   * Ask whether an imported resource should replace the existing resource with the same id.
   *
   * @param resourceType - Type shared by the existing and imported resources.
   * @param resourceId - Id shared by the existing and imported resources.
   * @returns True when the existing resource should be replaced.
   */
  private async confirmReplacement(resourceType: string, resourceId: string): Promise<boolean> {
    const modalRef = this.dialogService.showDialog(
      MessageType.WARNING,
      'Replace contained resource',
      `A contained ${resourceType} with id <strong>${resourceId}</strong> already exists. ` +
      'Replace its contents with the imported resource? The id is kept, so references to it remain valid.',
      [{label: 'Cancel', value: 'cancel'}, {label: 'Replace', value: 'replace'}]
    );
    return modalRef.result.then((result) => result === 'replace').catch(() => false);
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
      [...changes, 'The source file will not be changed.'].map((change) => `<p>${change}</p>`).join(''),
      [{label: 'Cancel', value: 'cancel'}, {label: 'Import resource', value: 'import'}]
    );
    return modalRef.result.then((result) => result === 'import').catch(() => false);
  }

  /**
   * Show a contained-resource import error. The message is plain text, but it can contain
   * imported values such as an invalid id or a file name, so it is escaped because the
   * message dialog renders HTML.
   *
   * @param message - Plain-text error message to display.
   */
  private showImportError(message: string): void {
    this.dialogService.showDialog(
      MessageType.DANGER,
      'Unable to import contained resource',
      this.containedResourceService.escapeHtml(message)
    );
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
   * @returns True when the row has no resourceType, so there is nothing to view or edit.
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
   * Check whether template-based extraction targets a contained resource id, at the
   * Questionnaire root or on any item.
   *
   * @param resourceId - Contained resource id.
   * @returns True when a template extraction targets the resource.
   */
  private isReferencedByTemplateExtraction(resourceId: string | undefined): boolean {
    return hasTemplateExtractReference(this.getCurrentQuestionnaire(), resourceId);
  }

  /**
   * Get the current Questionnaire. This table is in the form-level editor, whose model
   * excludes items, so items are read from the current Questionnaire.
   *
   * @returns Form-level fields combined with the current items.
   */
  private getCurrentQuestionnaire(): fhir.Questionnaire {
    return this.sharedObjectService.composeQuestionnaire(this.formProperty?.findRoot()?.value);
  }

  /**
   * Find a local reference to a contained resource anywhere in the current Questionnaire,
   * including its items and the other contained resources. A local reference is a string
   * value '#id', such as Reference.reference or a canonical such as answerValueSet.
   * The resource itself and form builder fields, whose names start with '__$', are skipped.
   *
   * @param resourceId - Contained resource id.
   * @returns FHIRPath-like location of the first reference found, e.g.
   *   "Questionnaire.item.where(linkId='q1').answerValueSet", or '' when there is none.
   */
  private findLocalReferencePath(resourceId: string | undefined): string {
    if(!resourceId) {
      return '';
    }
    const reference = `#${resourceId}`;

    /**
     * Quote a string as a FHIRPath string literal.
     *
     * @param value - String to quote.
     * @returns Quoted and escaped string.
     */
    const quote = (value: string): string => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

    /**
     * Get the path of an array element: an extension by its url, an item by its linkId,
     * a contained resource by its id, or another element by its index.
     *
     * @param arrayPath - Path of the array.
     * @param element - Array element.
     * @param index - Index of the element.
     * @returns Path of the element.
     */
    const getElementPath = (arrayPath: string, element: any, index: number): string => {
      if(/\.(modifierExtension|extension)$/.test(arrayPath) && typeof element?.url === 'string') {
        return `${arrayPath}(${quote(element.url)})`;
      }
      if(typeof element?.linkId === 'string') {
        return `${arrayPath}.where(linkId=${quote(element.linkId)})`;
      }
      if(typeof element?.resourceType === 'string' && typeof element?.id === 'string') {
        return `${arrayPath}.where(id=${quote(element.id)})`;
      }
      return `${arrayPath}[${index}]`;
    };

    /**
     * Search a node and its descendants for the reference.
     *
     * @param node - JSON value to search.
     * @param path - Path of the node.
     * @returns Path of the first reference found, or ''.
     */
    const search = (node: unknown, path: string): string => {
      if(typeof node === 'string') {
        return node === reference ? path : '';
      }
      if(Array.isArray(node)) {
        for(let index = 0; index < node.length; index++) {
          const element = node[index];
          if(path === 'Questionnaire.contained' && element?.id === resourceId) {
            continue;
          }
          const found = search(element, getElementPath(path, element, index));
          if(found) {
            return found;
          }
        }
        return '';
      }
      if(node && typeof node === 'object') {
        for(const [key, value] of Object.entries(node)) {
          const found = key.startsWith('__$') ? '' : search(value, `${path}.${key}`);
          if(found) {
            return found;
          }
        }
      }
      return '';
    };

    return search(this.getCurrentQuestionnaire(), 'Questionnaire');
  }
}
