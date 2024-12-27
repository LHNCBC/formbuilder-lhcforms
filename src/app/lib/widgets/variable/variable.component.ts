import { Component, OnInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import { FormService } from '../../../services/form.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ExpressionEditorDlgComponent } from '../expression-editor-dlg/expression-editor-dlg.component';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import {TableComponent} from '../table/table.component';
@Component({
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
  subscriptions: Subscription[] = [];

  /**
   * Invoke super constructor.
   *
   * @param formService - Inject form service
   */
  constructor(private formService: FormService,
    private modalService: NgbModal,
    public cdr: ChangeDetectorRef,
    private modelService: SharedObjectService,
    private elementRef: ElementRef) {
    super(elementRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.linkId = this.formProperty.findRoot().getProperty('linkId').value;
    this.modelService.questionnaire$.subscribe((questionnaire) => {
      this.questionnaire = questionnaire;
    });

    const extensions = this.formProperty.findRoot().getProperty('extension').value;
    this.formProperty.setValue(this.formService.filterVariableExtensions(extensions), false);
  }

  /**
   * Locate the custom extension 'variable type' and return the mapping variable type.
   * @param extensions - Item's extension.
   */
  getVariableType(extensions: any): string {
    const match = extensions.find((ext) => ext.url === FormService.CUSTOM_EXT_VARIABLE_TYPE);
    return this.variableTypeMapping[match?.valueString] ?? "Unknown";
  }

  /**
   * Get extension
   * @param items - FHIR questionnaire item array
   * @param linkId - linkId of question where to extract expression
   */
  extractExtension(items, linkId): fhir.Extension []|null {
    for (const item of items) {
      if (item.linkId === linkId && item.extension) {
        return item.extension
      } else if (item.item) {
        const extension = this.extractExtension(item.item, linkId);
        if (extension !== null)
          return extension;
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
   * Open the Expression Editor as a modal to create or edit variables.
   */
  editVariables(): void {
    let currentExtArray;
    const modalConfig: NgbModalOptions = {
      size: 'lg',
      fullscreen: 'lg'
    };
    const itemIndex = this.questionnaire.item.findIndex(item => item.linkId === this.linkId);
    if (itemIndex > -1) {
      if (this.formProperty.value) {
        currentExtArray =this.formService.removeVariablesExtensions(this.questionnaire.item[itemIndex].extension);
        this.questionnaire.item[itemIndex].extension = [...currentExtArray, ...this.formProperty.value];
      }
    }
    const modalRef = this.modalService.open(ExpressionEditorDlgComponent, modalConfig);
    modalRef.componentInstance.linkId = this.formProperty.findRoot().getProperty('linkId').value;
    modalRef.componentInstance.expressionUri = this.schema.widget.expressionUri;
    modalRef.componentInstance.questionnaire = this.questionnaire;
    modalRef.componentInstance.display = this.schema.widget.displayExpressionEditorSections;
    modalRef.result.then((result) => {
      // Result returning from the Rule Editor is the whole questionnaire.
      // Rule Editor returns false in the case changes were cancelled.
      if (result) {
        this.resultExtensions = this.extractExtension(result.item, this.linkId);

        const tmp = this.formService.filterVariableExtensions(this.resultExtensions);
        this.formProperty.setValue(tmp, false);

        this.cdr.detectChanges();

        this.formProperty.findRoot().getProperty('extension').setValue([...currentExtArray, ...tmp], false);
      }
    });
  }

  /**
   * Delete a variable from the array via index.
   * @param index - Index of the variable to be removed from the array.
   */
  deleteVariable(index: number) {
    let currentExtArray;
    currentExtArray = this.formService.removeVariablesExtensions(this.formProperty.findRoot().getProperty('extension').value);
    this.formProperty.value.splice(index, 1);
    this.formProperty.findRoot().getProperty('extension').setValue([...currentExtArray, ...this.formProperty.value], false);
  }

  /**
   * Clean up before destroy.
   * Unsubscribe all subscriptions.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((s) => {
      if(s) {
        s.unsubscribe();
      }
    });
  }
}
