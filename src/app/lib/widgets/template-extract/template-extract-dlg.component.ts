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
import {Util} from '../../util';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';
import {ExpressionEditorDlgComponent} from '../expression-editor-dlg/expression-editor-dlg.component';
import {
  buildTemplateExtractExtension,
  ContainedResourceOption,
  getContainedResourceOptions,
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
  private readonly cdr = inject(ChangeDetectorRef);

  readonly expressionFields = EXPRESSION_FIELDS;
  model: TemplateExtractEditModel;
  containedResources: ContainedResourceOption[] = [];
  isNew = true;
  bundleFieldsCollapsed = true;

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
   * Open the established expression editor for one string-valued FHIRPath slice.
   * @param field - templateExtract child slice to edit.
   */
  editExpression(field: TemplateExtractExpressionUrl): void {
    const expressionField = this.expressionFields.find(candidate => candidate.id === field);
    const context = this.createEditorContext();
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
        this.model[field] = this.extractEditedExpression(result, context, field);
        this.cdr.detectChanges();
      }
    });
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
   * Return a clean current Questionnaire suitable for the expression editor.
   * @returns Questionnaire without form-builder-only fields.
   */
  private getQuestionnaire(): fhir.Questionnaire {
    const rootValue = this.data.arrayProperty?.findRoot()?.value;
    const questionnaire = rootValue?.resourceType === 'Questionnaire'
      ? rootValue
      : this.sharedObjectService.questionnaire;
    return Util.convertToQuestionnaireJSON(questionnaire) as fhir.Questionnaire;
  }

  /**
   * Seed the current draft occurrence in a clean Questionnaire for native valueString editing.
   * An empty linkId selects Questionnaire.extension rather than an item's extensions.
   * @returns Isolated Questionnaire, target linkId, and owning extension index.
   * @throws Error when the current item or existing occurrence cannot be found.
   */
  private createEditorContext(): TemplateExtractExpressionContext {
    const questionnaire = this.getQuestionnaire();
    const linkId: string = this.data.arrayProperty.findRoot().getProperty('linkId')?.value || '';
    const target = linkId ? this.findItem(questionnaire.item, linkId) : questionnaire;
    if(!target) {
      throw new Error(`Cannot edit template extraction: item "${linkId}" was not found.`);
    }

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
    return {questionnaire, linkId, expressionParentIndex};
  }

  /**
   * Find an item recursively by linkId.
   * @param items - Questionnaire items to search.
   * @param linkId - Target linkId.
   * @returns Matching item, if present.
   */
  private findItem(items: fhir.QuestionnaireItem[] = [], linkId: string): fhir.QuestionnaireItem | undefined {
    for(const item of items) {
      if(item.linkId === linkId) {
        return item;
      }
      const nested = this.findItem(item.item, linkId);
      if(nested) {
        return nested;
      }
    }
    return undefined;
  }

  /**
   * Read only the selected field from the exact Questionnaire or item occurrence sent to the editor.
   * @param questionnaire - Questionnaire returned by the expression editor.
   * @param context - Target linkId (empty for Questionnaire scope) and owning extension index.
   * @param field - templateExtract child slice being edited.
   * @returns Saved FHIRPath string, or an empty string when removed in the editor.
   * @throws Error when the editor result is missing the selected occurrence.
   */
  private extractEditedExpression(
    questionnaire: fhir.Questionnaire,
    context: TemplateExtractExpressionContext,
    field: TemplateExtractExpressionUrl
  ): string {
    const target = context.linkId ? this.findItem(questionnaire.item, context.linkId) : questionnaire;
    const parent = target?.extension?.[context.expressionParentIndex];
    if(parent?.url !== EXTENSION_URL_TEMPLATE_EXTRACT) {
      throw new Error('Cannot read template extraction expression: the selected occurrence was not returned.');
    }
    return parent.extension?.find(extension => extension.url === field)?.valueString ?? '';
  }
}
