import { Component, OnInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import { FormService } from '../../../services/form.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ExpressionEditorDlgComponent } from '../expression-editor-dlg/expression-editor-dlg.component';
import fhir from 'fhir/r4';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import {TableComponent} from '../table/table.component';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { EXTENSION_URL_VARIABLE, EXTENSION_URL_CUSTOM_VARIABLE_TYPE } from '../../constants/constants';

@Component({
  standalone: false,
  selector: 'lfb-variable',
  templateUrl: './variable.component.html',
  styleUrl: './variable.component.css'
})
export class VariableComponent extends TableComponent implements OnInit {
  elementId: string;
  questionnaire = null;
  faAdd = faPlusCircle;
  linkId: string;
  private variableTypeMapping = {
    "expression": "FHIRPath Expression",
    "query": "FHIR Query",
    "queryObservation": "FHIR Query (Observation)",
    "question": "Question",
    "simple" : "Easy Path Expression"
  };
  resultExtensions: any;

  buttonName: string;

  /**
   * Invoke super constructor.
   *
   * @param formService - Inject form service
   */
  constructor(private formService: FormService,
    private modalService: NgbModal,
    public cdr: ChangeDetectorRef,
    private modelService: SharedObjectService,
    private extensionsService: ExtensionsService) {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.linkId = this.formProperty.findRoot().getProperty('linkId')?.value ?? '';
    const sub = this.modelService.questionnaire$.subscribe((questionnaire) => {
      this.questionnaire = questionnaire;
    });
    this.subscriptions.push(sub);

    const variablesExtension = this.extensionsService.getExtensionsByUrl(EXTENSION_URL_VARIABLE) ?? [];
    this.formProperty.setValue(variablesExtension, false);
  }

  /**
   * Locate the custom extension 'variable type' and return the mapping variable type.
   * @param extensions - Item's extension.
   */
  getVariableType(extensions: any): string {
    const match = extensions.find((ext) => ext.url === EXTENSION_URL_CUSTOM_VARIABLE_TYPE);
    return this.variableTypeMapping[match?.valueString] ?? "";
  }

  /**
   * Get extension
   * @param items - FHIR questionnaire item array
   * @param linkId - linkId of question where to extract expression
   */
  extractVariableExtensions(items, linkId): fhir.Extension []|null {
    for (const item of items) {
      if (item.linkId === linkId && item.extension) {
        const variableExtensions = item.extension.filter(ext => ext.url === EXTENSION_URL_VARIABLE);
        if (variableExtensions.length > 0) {
          return variableExtensions;
        }
      } else if (item.item) {
        const extension = this.extractVariableExtensions(item.item, linkId);
        if (extension !== null) {
          return extension;
        }
      }
    }

    return null;
  }

  /**
   * Retrieves variable header description or data.
   * @param parentProperty - header schema or data object.
   * @param propertyId - field to display.
   * @param isHeader - indicates whether to return header description or data.
   */
  getVariableProperty(parentProperty: any, propertyId: string, isHeader: boolean): string {
    const path = propertyId.split('.');
    let p = parentProperty;
    for (const id of path) {
      p = (!isHeader && id === 'extension') ? this.getVariableType(p[id]) : p[id];
    }

    return (isHeader) ? p.description : p;
  }

  /**
   * Retrieves a list of variable fields structure.
   * @param isHeader - indicates whether to return header fields or data fields.
   * @returns - A list of header or data fields structure.
   */
  getVariableFieldsStructure(isHeader: boolean): any [] {
    let ret: any [] = [];
    if (this.formProperty.schema.widget) {
      if (isHeader) {
        return this.formProperty.schema.widget.showHeaderFields;
      } else {
        return this.formProperty.schema.widget.showDataFields;
      }
    }
    return ret;
  }

  /**
   * Filter out empty variables.
   * @returns - Array of non-empty variables or an empty array.
   */
  get nonEmptyVariables() {
    return (this.formProperty.value ?? []).filter(v => v && (
      (Array.isArray(v.extension) && v.extension.length > 0) ||
      (v.valueExpression &&
        'name' in v.valueExpression &&
        'language' in v.valueExpression &&
        'expression' in v.valueExpression)
    ));
  }

  /**
   * Open the Expression Editor as a modal to create or edit variables.
   */
  editVariables(): void {
    let currentExtArray;
    const modalConfig: NgbModalOptions = {
      size: 'lg',
      fullscreen: 'lg'
    };

    if (this.linkId) {
      const itemIndex = this.questionnaire.item.findIndex(item => item.linkId === this.linkId);
      if (itemIndex > -1) {
        if (this.formProperty.value) {
          this.questionnaire.item[itemIndex].extension = this.extensionsService.extensionsProp.value;
        }
      }
    }
    const modalRef = this.modalService.open(ExpressionEditorDlgComponent, modalConfig);
    const linkId = this.formProperty.findRoot().getProperty('linkId')?.value ?? '';
    modalRef.componentInstance.linkId = linkId;
    modalRef.componentInstance.expressionUri = this.schema.widget.expressionUri;
    modalRef.componentInstance.questionnaire = this.questionnaire;
    modalRef.componentInstance.display = this.schema.widget.displayExpressionEditorSections;
    modalRef.result.then((result) => {
      // Result returning from the Rule Editor is the whole questionnaire.
      // Rule Editor returns false in the case changes were cancelled.
      if (result) {
        if (this.linkId) {
          this.resultExtensions = this.extractVariableExtensions(result.item, this.linkId);
        } else {
          this.resultExtensions = result.extension;
        }

        // Result coming back from the Expression Editor may also contain launchContext.  We do want
        // to save those extensions, but want to filter out from the variables.
        this.extensionsService.replaceExtensions(EXTENSION_URL_VARIABLE, this.resultExtensions);

        const variables = this.extensionsService.getExtensionsByUrl(EXTENSION_URL_VARIABLE);
        this.formProperty.setValue(variables, false);
        this.cdr.detectChanges();
        this.formProperty.findRoot().getProperty('extension').setValue(this.extensionsService.extensionsProp.value, false);
      }
    });
  }

  /**
   * Delete a variable from the array via index.
   * @param index - Index of the variable to be removed from the array.
   */
  deleteVariable(index: number) {
    let currentExtArray;
    const tmpt = this.extensionsService.removeExtensionByUrlAtIndex(EXTENSION_URL_VARIABLE, index);
    const variablesExtension = this.extensionsService.getExtensionsByUrl(EXTENSION_URL_VARIABLE) ?? [];
    this.formProperty.setValue(variablesExtension, false);
    this.cdr.markForCheck();
  }
}
