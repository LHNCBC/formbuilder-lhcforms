import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FormProperty, SchemaFormModule} from '@lhncbc/ngx-schema-form';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTooltip} from '@angular/material/tooltip';
import fhir from 'fhir/r4';
import {AppFormElementComponent} from '../form-element/form-element.component';
import {BooleanControlledComponent} from '../boolean-controlled/boolean-controlled.component';
import {IsDisabledPipe} from '../../pipes/is-disabled.pipe';
import {LabelComponent} from '../label/label.component';
import {TitleComponent} from '../title/title.component';
import {TableEditRowInDlgComponent} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {SharedObjectService} from '../../../services/shared-object.service';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';
import {TemplateExtractDlgComponent} from './template-extract-dlg.component';
import {
  ContainedResourceOption,
  findDuplicateTemplateExtractGroups,
  getContainedResourceOptions,
  getDuplicateTemplateExtractTableWarning,
  parseTemplateExtractExtension,
  TemplateExtractEditModel
} from './template-extract.util';

/**
 * Edit repeatable SDC templateExtract extensions as a read-only summary table.
 * Each occurrence is created or edited in a dedicated dialog.
 */
@Component({
  selector: 'lfb-template-extract',
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
export class TemplateExtractComponent extends TableEditRowInDlgComponent implements OnInit, AfterViewInit {
  private readonly extensionsService = inject(ExtensionsService);
  private readonly sharedObjectService = inject(SharedObjectService);
  private updatingExtensions = false;

  containedResources: ContainedResourceOption[] = [];

  /** Use the template extraction dialog to add and edit table rows. */
  constructor() {
    super();
    this.dialogComponentType = TemplateExtractDlgComponent;
  }

  /** Initialize the table and its contained-resource choices. */
  override ngOnInit(): void {
    this.addDefaultItemIfEmpty = false;
    super.ngOnInit();
    this.refreshContainedResources(this.sharedObjectService.questionnaire);
    this.syncFromExtensions();
  }

  /** Observe questionnaire and extension changes after the table is materialized. */
  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.subscriptions.push(this.sharedObjectService.questionnaire$.subscribe(questionnaire => {
      this.refreshContainedResources(questionnaire);
    }));
    this.subscriptions.push(this.extensionsService.extensionsObservable.subscribe(() => {
      if(!this.updatingExtensions) {
        this.syncFromExtensions();
      }
    }));
  }

  /**
   * Disable creation until a contained template exists.
   * @returns True when the standard table rules or missing templates prevent creation.
   */
  override isAddButtonDisabled(): boolean {
    return super.isAddButtonDisabled() || this.containedResources.length === 0;
  }

  /**
   * Render every configured summary column as read-only text.
   * @param _showField - Configured table field.
   * @returns Always true for this dialog-backed table.
   */
  override useDisplayRenderer(_showField: any): boolean {
    return true;
  }

  /**
   * Keep synthetic summary columns visible even though they are not Extension schema fields.
   * @param _propertyId - Configured summary-field identifier.
   * @returns Always true for the type-neutral summary fields.
   */
  override isVisible(_propertyId: string): boolean {
    return true;
  }

  /**
   * Return a display value for one templateExtract table cell.
   * @param itemProperty - Form property containing a templateExtract extension.
   * @param showField - Configured summary column.
   * @returns Human-readable table-cell text.
   */
  override getDisplayValue(itemProperty: FormProperty, showField: any): string {
    const model = parseTemplateExtractExtension(itemProperty?.value as fhir.Extension);
    switch(showField?.field) {
      case 'template':
        return this.getTemplateLabel(model.templateReference);
      case 'fullUrl':
        return model.fullUrl;
      case 'resourceId':
        return model.resourceId;
      case 'conditionalRequest':
        return this.getConditionalRequestSummary(model);
      default:
        return '';
    }
  }

  /**
   * Add a dialog result and mirror the occurrences into Questionnaire.extension.
   * @param newValue - Complex templateExtract extension returned by the dialog.
   */
  override addNewItem(newValue: fhir.Extension): void {
    super.addNewItem(newValue);
    this.persistExtensions();
  }

  /**
   * Replace a dialog-edited row and mirror the occurrences into Questionnaire.extension.
   * @param index - Row being replaced.
   * @param submittedValue - Complex templateExtract extension returned by the dialog.
   */
  protected override replaceRowValue(index: number, submittedValue: unknown): void {
    const extensions = (this.formProperty.properties as FormProperty[])
      .map((property, rowIndex) => rowIndex === index ? submittedValue : property.value) as fhir.Extension[];
    this.formProperty.reset(extensions, false);
    this.persistExtensions(extensions);
  }

  /**
   * Remove a row and mirror the remaining occurrences into Questionnaire.extension.
   * @param index - Row to remove.
   */
  override removeProperty(index: number): void {
    super.removeProperty(index);
    this.persistExtensions();
  }

  /**
   * Move a row up without looking for an editable table input, then persist the new order.
   * @param index - Row to move.
   */
  override onMoveUp(index: number): void {
    this.moveRow(index, index - 1);
  }

  /**
   * Move a row down without looking for an editable table input, then persist the new order.
   * @param index - Row to move.
   */
  override onMoveDown(index: number): void {
    this.moveRow(index, index + 1);
  }

  /**
   * Resolve a local reference to the same label used by the dialog selector.
   * @param reference - Contained-resource reference.
   * @returns Resource label, or a missing-reference marker.
   */
  private getTemplateLabel(reference: string): string {
    return this.containedResources.find(resource => resource.reference === reference)?.label
      || (reference ? `${reference} (missing)` : '');
  }

  /**
   * Summarize populated conditional Bundle request expressions.
   * @param model - Parsed templateExtract occurrence.
   * @returns Comma-delimited field/value summary.
   */
  private getConditionalRequestSummary(model: TemplateExtractEditModel): string {
    return (['ifNoneMatch', 'ifModifiedSince', 'ifMatch', 'ifNoneExist'] as const)
      .filter(field => !!model[field])
      .map(field => `${field}: ${model[field]}`)
      .join(', ');
  }

  /**
   * Reorder the extension rows and synchronize the canonical extension array.
   * @param fromIndex - Existing row index.
   * @param toIndex - Destination row index.
   */
  private moveRow(fromIndex: number, toIndex: number): void {
    const values = (this.formProperty.properties as FormProperty[]).map(property => property.value);
    if(fromIndex < 0 || fromIndex >= values.length || toIndex < 0 || toIndex >= values.length) {
      return;
    }
    const [moved] = values.splice(fromIndex, 1);
    values.splice(toIndex, 0, moved);
    this.formProperty.reset(values, false);
    this.persistExtensions();
  }

  /**
   * Refresh the dialog/table labels from the current Questionnaire model.
   * @param questionnaire - Current Questionnaire emitted by the shared model service.
   */
  private refreshContainedResources(questionnaire: fhir.Questionnaire): void {
    const rootValue = this.formProperty?.findRoot()?.value;
    const currentQuestionnaire = rootValue?.resourceType === 'Questionnaire' ? rootValue : questionnaire;
    this.containedResources = getContainedResourceOptions(currentQuestionnaire);
    this.cdr.markForCheck();
  }

  /** Refresh this derived field and its duplicate-row warning when another extension editor changes the canonical array. */
  private syncFromExtensions(): void {
    const extensions = (this.extensionsService.extensionsProp?.value || [])
      .filter(extension => extension?.url === EXTENSION_URL_TEMPLATE_EXTRACT);
    if(JSON.stringify(this.formProperty.value || []) !== JSON.stringify(extensions)) {
      this.formProperty.reset(extensions, false);
      this.cdr.markForCheck();
    }
    this.updateDuplicateWarning();
  }

  /**
   * Show a non-blocking table warning when rows at this scope use the same template with
   * identical expressions, since each row is extracted separately.
   */
  private updateDuplicateWarning(): void {
    const extensions = (this.formProperty.properties as FormProperty[])
      .map(property => property.value as fhir.Extension);
    const message = getDuplicateTemplateExtractTableWarning(findDuplicateTemplateExtractGroups(extensions));
    this.tableStatus = message ? {type: 'warning', message} : null;
    this.cdr.markForCheck();
  }

  /**
   * Persist the table rows as repeatable templateExtract extensions at the current scope,
   * then refresh the duplicate-row warning.
   * @param extensions - Exact extension values to persist; defaults to the current table rows.
   */
  private persistExtensions(
    extensions: fhir.Extension[] = (this.formProperty.properties as FormProperty[])
      .map(property => property.value as fhir.Extension)
  ): void {
    extensions.forEach(extension => this.extensionsService.updateExtension(extension));

    this.updatingExtensions = true;
    try {
      this.extensionsService.replaceAllExtensionsByUrl(EXTENSION_URL_TEMPLATE_EXTRACT, extensions);
    }
    finally {
      this.updatingExtensions = false;
    }
    this.updateDuplicateWarning();
  }
}
