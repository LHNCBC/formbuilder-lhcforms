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
import copy from 'fast-copy';
import fhir from 'fhir/r4';
import {ArrayProperty} from '@lhncbc/ngx-schema-form';
import {SharedObjectService} from '../../../services/shared-object.service';
import {Util} from '../../util';
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

const EXPRESSION_FIELDS: TemplateExtractExpressionField[] = [
  {id: 'fullUrl', label: 'fullUrl', description: 'FHIRPath used to populate Bundle.entry.fullUrl.'},
  {id: 'resourceId', label: 'resourceId', description: 'FHIRPath used to populate the extracted resource id.'},
  {id: 'ifNoneMatch', label: 'ifNoneMatch', description: 'FHIRPath used to populate Bundle.entry.request.ifNoneMatch.'},
  {id: 'ifModifiedSince', label: 'ifModifiedSince', description: 'FHIRPath used to populate Bundle.entry.request.ifModifiedSince.'},
  {id: 'ifMatch', label: 'ifMatch', description: 'FHIRPath used to populate Bundle.entry.request.ifMatch.'},
  {id: 'ifNoneExist', label: 'ifNoneExist', description: 'FHIRPath used to populate Bundle.entry.request.ifNoneExist.'}
];

const TEMP_EXPRESSION_URI_PREFIX = 'urn:formbuilder:template-extract-expression:';
const ROOT_EDITOR_LINK_ID = '__formbuilder_template_extract_expression__';

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
    const expressionUri = `${TEMP_EXPRESSION_URI_PREFIX}${field}`;
    const editorQuestionnaire = this.createEditorQuestionnaire(expressionUri, this.model[field]);
    const editorLinkId = this.getEditorLinkId();
    const modalConfig: NgbModalOptions = {size: 'lg', fullscreen: 'lg'};
    const modalRef = this.modalService.open(ExpressionEditorDlgComponent, modalConfig);

    modalRef.componentInstance.linkId = editorLinkId;
    modalRef.componentInstance.expressionUri = expressionUri;
    modalRef.componentInstance.questionnaire = editorQuestionnaire;
    modalRef.componentInstance.expressionLabel = `${expressionField?.label || field} FHIRPath expression`;
    modalRef.componentInstance.display = {
      titleSection: true,
      uneditableVariablesSection: true,
      itemVariablesSection: false,
      outputExpressionSection: true
    };

    modalRef.result.then(result => {
      if(result) {
        this.model[field] = this.extractEditedExpression(result, expressionUri);
        this.cdr.detectChanges();
      }
    }).catch(() => undefined);
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
   * Return the current item linkId, or a synthetic item id for form-level editing.
   * @returns Item linkId used as the expression-editor context.
   */
  private getEditorLinkId(): string {
    return this.data.arrayProperty?.findRoot()?.getProperty('linkId')?.value || ROOT_EDITOR_LINK_ID;
  }

  /**
   * Seed a copied Questionnaire with the valueExpression format required by the editor.
   * @param expressionUri - Temporary extension URL unique to the edited field.
   * @param expression - Existing FHIRPath string.
   * @returns Questionnaire copy used only inside the expression-editor modal.
   */
  private createEditorQuestionnaire(expressionUri: string, expression: string): fhir.Questionnaire {
    const questionnaire = copy(this.getQuestionnaire());
    const editorLinkId = this.getEditorLinkId();
    let item = this.findItem(questionnaire.item, editorLinkId);
    if(!item) {
      item = {
        linkId: ROOT_EDITOR_LINK_ID,
        text: 'Template extraction expression',
        type: 'group'
      };
      questionnaire.item = [...(questionnaire.item || []), item];
    }

    item.extension = (item.extension || []).filter(extension => extension.url !== expressionUri);
    if(expression) {
      item.extension.push({
        url: expressionUri,
        valueExpression: {
          language: 'text/fhirpath',
          expression
        }
      });
    }
    return questionnaire;
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
   * Read the editor's valueExpression result back into a templateExtract valueString.
   * @param questionnaire - Questionnaire returned by the expression editor.
   * @param expressionUri - Temporary extension URL.
   * @returns Saved FHIRPath string, or an empty string when removed in the editor.
   */
  private extractEditedExpression(
    questionnaire: fhir.Questionnaire,
    expressionUri: string
  ): string {
    const rootExpression = [...(questionnaire.extension || [])].reverse()
      .find(extension => extension.url === expressionUri)
      ?.valueExpression?.expression;
    if(rootExpression) {
      return rootExpression;
    }
    return this.findExpressionInItems(questionnaire.item, expressionUri);
  }

  /**
   * Find the temporary expression extension recursively without assuming where the editor reinserted it.
   * @param items - Questionnaire items to search.
   * @param expressionUri - Temporary extension URL.
   * @returns FHIRPath string, or an empty string when absent.
   */
  private findExpressionInItems(
    items: fhir.QuestionnaireItem[] = [],
    expressionUri: string
  ): string {
    for(const item of items) {
      const expression = [...(item.extension || [])].reverse()
        .find(extension => extension.url === expressionUri)
        ?.valueExpression?.expression;
      if(expression) {
        return expression;
      }
      const nestedExpression = this.findExpressionInItems(item.item, expressionUri);
      if(nestedExpression) {
        return nestedExpression;
      }
    }
    return '';
  }
}
