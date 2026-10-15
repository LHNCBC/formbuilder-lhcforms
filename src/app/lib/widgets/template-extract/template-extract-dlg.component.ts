import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {NgbCollapseModule, NgbModal, NgbModalOptions} from '@ng-bootstrap/ng-bootstrap';
import fhir from 'fhir/r4';
import {ArrayProperty} from '@lhncbc/ngx-schema-form';
import {SharedObjectService} from '../../../services/shared-object.service';
import {DialogService} from '../../../services/dialog.service';
import {Util} from '../../util';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';
import {ExpressionEditorDlgComponent} from '../expression-editor-dlg/expression-editor-dlg.component';
import {MessageType} from '../message-dlg/message-dlg.component';
import {
  buildTemplateExtractExtension,
  ContainedResourceOption,
  getContainedResourceOptions,
  getDuplicateTemplateExtractDialogWarning,
  getTemplateExtractSignature,
  parseTemplateExtractExtension,
  TemplateExtractEditModel,
  TemplateExtractExpressionUrl
} from './template-extract.util';

export interface TemplateExtractDialogData {
  arrayProperty: ArrayProperty;
  rowIndex: number;
}

interface TemplateExtractExpressionField {
  id: TemplateExtractExpressionUrl;
  label: string;
  description: string;
}

interface TemplateExtractExpressionContext {
  questionnaire: fhir.Questionnaire;
  // True when editing Questionnaire.extension; the editor then receives an empty linkId.
  isFormLevel: boolean;
  linkId: string;
  expressionParentIndex: number;
}

const EXPRESSION_FIELDS: TemplateExtractExpressionField[] = [
  {id: 'fullUrl', label: 'fullUrl', description: 'FHIRPath used to populate Bundle.entry.fullUrl.'},
  {id: 'resourceId', label: 'resourceId', description: 'FHIRPath used to populate the extracted resource id.'},
  {id: 'ifNoneMatch', label: 'ifNoneMatch', description: 'FHIRPath used to populate Bundle.entry.request.ifNoneMatch.'},
  {id: 'ifModifiedSince', label: 'ifModifiedSince', description: 'FHIRPath used to populate Bundle.entry.request.ifModifiedSince.'},
  {id: 'ifMatch', label: 'ifMatch', description: 'FHIRPath used to populate Bundle.entry.request.ifMatch.'},
  {id: 'ifNoneExist', label: 'ifNoneExist', description: 'FHIRPath used to populate Bundle.entry.request.ifNoneExist.'}
];

/** Dialog for creating or editing one complex SDC templateExtract extension. */
@Component({
  selector: 'lfb-template-extract-dlg',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatIconButton,
    MatIconModule,
    MatTooltip,
    NgbCollapseModule
  ],
  templateUrl: './template-extract-dlg.component.html',
  styleUrl: './template-extract-dlg.component.css'
})
export class TemplateExtractDlgComponent implements OnInit {
  private readonly data = inject<TemplateExtractDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TemplateExtractDlgComponent>);
  private readonly modalService = inject(NgbModal);
  private readonly sharedObjectService = inject(SharedObjectService);
  private readonly dialogService = inject(DialogService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly expressionFields = EXPRESSION_FIELDS;
  model: TemplateExtractEditModel;
  containedResources: ContainedResourceOption[] = [];
  isNew = true;
  bundleFieldsCollapsed = true;
  // Comparison keys of the other rows at this scope, which cannot change while the dialog is open.
  private otherRowSignatures: {rowNumber: number; signature: string}[] = [];

  /** Initialize the dialog from an existing occurrence or a blank model. */
  ngOnInit(): void {
    this.isNew = this.data.rowIndex < 0;
    const extension = this.isNew
      ? undefined
      : this.data.arrayProperty.properties[this.data.rowIndex]?.value as fhir.Extension;
    this.model = extension
      ? parseTemplateExtractExtension(extension)
      : this.createNewModel();
    this.bundleFieldsCollapsed = !this.hasBundleFieldValue();
    this.otherRowSignatures = this.getOtherRowSignatures();

    const questionnaire = this.getQuestionnaire();
    this.containedResources = getContainedResourceOptions(questionnaire);
    if(this.isNew && this.containedResources.length) {
      this.model.templateReference = this.containedResources[0].reference;
    }
  }

  /** Close without returning a changed extension. */
  cancel(): void {
    this.dialogRef.close(false);
  }

  /** Build the complex extension and return it to the table. */
  save(): void {
    if(this.canSave()) {
      this.dialogRef.close(buildTemplateExtractExtension(this.model));
    }
  }

  /**
   * Check whether the selected template still resolves to a contained resource.
   * @returns True when the selected reference is available.
   */
  canSave(): boolean {
    return this.containedResources.some(resource => resource.reference === this.model?.templateReference);
  }

  /** Toggle visibility of the optional Bundle entry expression fields. */
  toggleBundleFields(): void {
    this.bundleFieldsCollapsed = !this.bundleFieldsCollapsed;
  }

  /**
   * Describe other rows at this scope that already use the selected template with identical
   * expressions. The warning does not block saving, because repetition may be intentional.
   * @returns Warning text, or an empty string when the draft is not a duplicate.
   */
  getDuplicateWarning(): string {
    const signature = getTemplateExtractSignature(this.model);
    const rowNumbers = this.otherRowSignatures
      .filter(row => row.signature === signature)
      .map(row => row.rowNumber);
    return getDuplicateTemplateExtractDialogWarning(rowNumbers);
  }

  /**
   * Open the established expression editor for one string-valued FHIRPath slice.
   * Problems locating the item or occurrence are reported in an error dialog.
   * @param field - templateExtract child slice to edit.
   */
  editExpression(field: TemplateExtractExpressionUrl): void {
    const expressionField = this.expressionFields.find(candidate => candidate.id === field);
    let context: TemplateExtractExpressionContext;
    try {
      context = this.createEditorContext();
    }
    catch(error) {
      this.showExpressionError(error);
      return;
    }
    const modalConfig: NgbModalOptions = {size: 'lg', fullscreen: 'lg'};
    const modalRef = this.modalService.open(ExpressionEditorDlgComponent, modalConfig);

    modalRef.componentInstance.linkId = context.linkId;
    modalRef.componentInstance.expressionUri = field;
    modalRef.componentInstance.expressionValueType = 'valueString';
    modalRef.componentInstance.expressionParentIndex = context.expressionParentIndex;
    modalRef.componentInstance.questionnaire = context.questionnaire;
    modalRef.componentInstance.expressionLabel = `${expressionField?.label || field} FHIRPath expression`;
    modalRef.componentInstance.display = {
      titleSection: true,
      uneditableVariablesSection: true,
      itemVariablesSection: false,
      outputExpressionSection: true
    };

    modalRef.closed.subscribe((result: fhir.Questionnaire | false) => {
      if(result) {
        try {
          this.model[field] = this.extractEditedExpression(result, context, field);
        }
        catch(error) {
          this.showExpressionError(error);
          return;
        }
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Report a failure to open or read the expression editor, leaving the draft unchanged.
   * @param error - Error thrown while preparing or reading the editor Questionnaire.
   */
  private showExpressionError(error: unknown): void {
    this.dialogService.showDialog(
      MessageType.DANGER,
      'Unable to edit expression',
      error instanceof Error ? error.message : String(error)
    );
  }

  /**
   * Create a blank edit model for a new extension occurrence.
   * @returns Empty templateExtract edit model.
   */
  private createNewModel(): TemplateExtractEditModel {
    return {
      templateReference: '',
      fullUrl: '',
      resourceId: '',
      ifNoneMatch: '',
      ifModifiedSince: '',
      ifMatch: '',
      ifNoneExist: ''
    };
  }

  /**
   * Check whether any optional Bundle entry expression has a value.
   * @returns True when at least one expression field contains non-whitespace text.
   */
  private hasBundleFieldValue(): boolean {
    return this.expressionFields.some(field => !!this.model[field.id]?.trim());
  }

  /**
   * Compute comparison keys for the rows at this scope other than the one being edited.
   * @returns One-based row numbers with their comparison keys.
   */
  private getOtherRowSignatures(): {rowNumber: number; signature: string}[] {
    return ((this.data.arrayProperty?.properties || []) as {value: unknown}[])
      .map((property, index) => ({
        rowNumber: index + 1,
        signature: getTemplateExtractSignature(parseTemplateExtractExtension(property?.value as fhir.Extension))
      }))
      .filter((_row, index) => index !== this.data.rowIndex);
  }

  /**
   * Return a clean current Questionnaire suitable for the expression editor.
   * At form level, the editor model excludes items, so it is combined with the current
   * item tree; at item level, the current Questionnaire is used.
   * @returns Questionnaire without form-builder-only fields.
   */
  private getQuestionnaire(): fhir.Questionnaire {
    const questionnaire = this.sharedObjectService.composeQuestionnaire(
      this.data.arrayProperty?.findRoot()?.value
    );
    return Util.convertToQuestionnaireJSON(questionnaire) as fhir.Questionnaire;
  }

  /**
   * Seed the current draft occurrence in a clean Questionnaire for native valueString editing.
   * The form-level model targets Questionnaire.extension, passed to the editor with an empty
   * linkId; an item-level model targets the one item with the model's linkId.
   * @returns Isolated Questionnaire, target linkId, and owning extension index.
   * @throws Error when the item's linkId is empty, duplicated, or not found, or when the
   *   existing occurrence cannot be found.
   */
  private createEditorContext(): TemplateExtractExpressionContext {
    const questionnaire = this.getQuestionnaire();
    const root = this.data.arrayProperty.findRoot();
    const isFormLevel = root?.value?.resourceType === 'Questionnaire';
    const linkId: string = isFormLevel ? '' : root?.getProperty('linkId')?.value || '';
    const target = isFormLevel ? questionnaire : this.findUniqueItem(questionnaire.item, linkId);
    target.extension = target.extension || [];
    let expressionParentIndex = target.extension.length;
    if(!this.isNew) {
      let occurrenceIndex = -1;
      expressionParentIndex = target.extension.findIndex(extension =>
        extension.url === EXTENSION_URL_TEMPLATE_EXTRACT && ++occurrenceIndex === this.data.rowIndex
      );
      if(expressionParentIndex < 0) {
        throw new Error('Cannot edit template extraction: the selected occurrence was not found.');
      }
    }
    target.extension[expressionParentIndex] = buildTemplateExtractExtension(this.model);
    return {questionnaire, isFormLevel, linkId, expressionParentIndex};
  }

  /**
   * Find the single item with a linkId, searching recursively.
   * @param items - Questionnaire items to search.
   * @param linkId - Target linkId.
   * @returns The matching item.
   * @throws Error when the linkId is empty, not found, or used by more than one item.
   */
  private findUniqueItem(items: fhir.QuestionnaireItem[] | undefined, linkId: string): fhir.QuestionnaireItem {
    if(!linkId) {
      throw new Error('Cannot edit template extraction: this item has no Link Id. Enter a unique Link Id, then try again.');
    }
    const matches = this.findItems(items, linkId);
    if(!matches.length) {
      throw new Error(`Cannot edit template extraction: item "${linkId}" was not found.`);
    }
    if(matches.length > 1) {
      throw new Error(
        `Cannot edit template extraction: Link Id "${linkId}" is used by ${matches.length} items. ` +
        'Make it unique, then try again.'
      );
    }
    return matches[0];
  }

  /**
   * Collect every item with a linkId, searching recursively.
   * @param items - Questionnaire items to search.
   * @param linkId - Target linkId.
   * @param matches - Accumulated matches.
   * @returns All matching items, in document order.
   */
  private findItems(
    items: fhir.QuestionnaireItem[] = [],
    linkId: string,
    matches: fhir.QuestionnaireItem[] = []
  ): fhir.QuestionnaireItem[] {
    for(const item of items) {
      if(item.linkId === linkId) {
        matches.push(item);
      }
      this.findItems(item.item, linkId, matches);
    }
    return matches;
  }

  /**
   * Read only the selected field from the exact Questionnaire or item occurrence sent to the editor.
   * @param questionnaire - Questionnaire returned by the expression editor.
   * @param context - Target scope, linkId, and owning extension index.
   * @param field - templateExtract child slice being edited.
   * @returns Saved FHIRPath string, or an empty string when removed in the editor.
   * @throws Error when the editor result is missing the selected item or occurrence.
   */
  private extractEditedExpression(
    questionnaire: fhir.Questionnaire,
    context: TemplateExtractExpressionContext,
    field: TemplateExtractExpressionUrl
  ): string {
    const target = context.isFormLevel ? questionnaire : this.findUniqueItem(questionnaire.item, context.linkId);
    const parent = target?.extension?.[context.expressionParentIndex];
    if(parent?.url !== EXTENSION_URL_TEMPLATE_EXTRACT) {
      throw new Error('Cannot read template extraction expression: the selected occurrence was not returned.');
    }
    return parent.extension?.find(extension => extension.url === field)?.valueString ?? '';
  }
}
