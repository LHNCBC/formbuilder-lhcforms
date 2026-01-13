import { Component, Input, OnInit, AfterViewInit, Output, EventEmitter, ChangeDetectorRef, inject } from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import { FormControl } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ExpressionEditorDlgComponent } from '../expression-editor-dlg/expression-editor-dlg.component';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import { ExtensionsService } from 'src/app/services/extensions.service';
import {
  EXTENSION_URL_INITIAL_EXPRESSION,
  EXTENSION_URL_CALCULATED_EXPRESSION,
  EXTENSION_URL_ANSWER_EXPRESSION,
  EXTENSION_URL_ENABLEWHEN_EXPRESSION,
  EXTENSION_URL_VARIABLE,
  VALUE_METHOD_COMPUTE_INITIAL,
  VALUE_METHOD_COMPUTE_CONTINUOUSLY
} from '../../constants/constants';

@Component({
  standalone: false,
  selector: 'lfb-expression-editor',
  templateUrl: './expression-editor.component.html',
  styleUrl: './expression-editor.component.css'
})
export class ExpressionEditorComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {
  private modalService = inject(NgbModal);
  private cdr = inject(ChangeDetectorRef);
  private modelService = inject(SharedObjectService);
  private extensionsService = inject(ExtensionsService);

  @Input() model: any;
  @Input() exp: string;
  @Output() questionnaireChange = new EventEmitter<fhir4.Questionnaire>();

  elementId: string;
  // control is already declared in the base class.
  // control = new FormControl();
  questionnaire = null;
  private LANGUAGE_FHIRPATH = 'text/fhirpath';
  linkId: string;
  expression: string;
  valueMethod: string;
  itemId: number;
  faAdd = faPlusCircle;
  noTableLabel = false;

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    this.modelService.questionnaire$.subscribe((questionnaire) => {
      this.questionnaire = questionnaire;
    });

    this.noTableLabel = !!this.formProperty.schema.widget.noTableLabel;
    this.itemId = this.formProperty.findRoot().getProperty('id').value;
    this.linkId = this.formProperty.findRoot().getProperty('linkId').value;
    this.valueMethod = this.formProperty.findRoot().getProperty('__$valueMethod').value;
  };

  ngAfterViewInit(): void {
    const item = this.formProperty.findRoot().value;
    if (!this.questionnaire || !Array.isArray(this.questionnaire.item)) {
      return;
    }
    const itemIndex = this.questionnaire.item.findIndex(item => item.linkId === this.linkId);

    if (item && typeof item === 'object' && 'extension' in item) {
      // Always check for enableWhenExpression and set it if present
      if (this.formProperty.path === "/__$enableWhenExpression") {
        const enableWhenExt = this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_ENABLEWHEN_EXPRESSION);
        if (enableWhenExt) {
          this.expression = enableWhenExt.valueExpression.expression;
          this.formProperty.setValue(enableWhenExt, false);

          this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_ENABLEWHEN_EXPRESSION);
          this.extensionsService.insertExtensionAfterURL(EXTENSION_URL_VARIABLE, [enableWhenExt]);
        }
      } else {
        let exp = null;
        if (this.formProperty.path === "/__$answerExpression") {
          exp = this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_ANSWER_EXPRESSION);
        } else if (this.formProperty.path === "/__$initialExpression" || this.formProperty.path === "/__$calculatedExpression") {
          exp = this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_INITIAL_EXPRESSION) ||
                this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_CALCULATED_EXPRESSION);
        }

        if (exp) {
          this.expression = exp.valueExpression.expression;
          this.formProperty.setValue(exp, false);
          this.updateOutputExtensionUrl(exp, itemIndex);
        } else if (this.formProperty.value) {
          const outputExpression = this.getOutputExpressionFromFormProperty();
          if (!this.extensionsService.isEmptyValueExpression(outputExpression)) {
            this.expression = outputExpression?.valueExpression?.expression;
            const outputExpressionExtension = { ...outputExpression};
            outputExpressionExtension.url = this.getUrlByValueMethod(this.valueMethod);
            this.extensionsService.insertExtensionAfterURL(EXTENSION_URL_VARIABLE, [outputExpressionExtension]);
          }
        }
      }
    }
  }


  /**
   * Fetches the 'initial expression' from the FormProperty. If it is empty, returns the 'calculated expression' instead.
   * @returns - the output expression from either the 'initial expression' or the 'calculated expression'.
   */
  getOutputExpressionFromFormProperty(): any {
    const properties = (this.formProperty.path !== "/__$answerExpression" &&
                        (this.valueMethod === VALUE_METHOD_COMPUTE_INITIAL || this.valueMethod === VALUE_METHOD_COMPUTE_CONTINUOUSLY)) ?
                         [
                           '__$initialExpression',
                           '__$calculatedExpression'
                         ] :
                         [
                           '__$answerExpression'
                         ];

    for (const prop of properties) {
      const expr = this.formProperty.findRoot().getProperty(prop).value;
      if (!this.extensionsService.isEmptyValueExpression(expr)) {
        return expr;
      }
    }

    return null;
  }

  /**
   * Update the output extension url of a questionnaire item based on the selected value method.
   * @param extension - the current extension object that needs to be updated.
   * @param itemIndex - the index of the item in the questionnaire that is being updated.
   */
  updateOutputExtensionUrl(extension: any, itemIndex: any): void {
    const outputExpressionUrl = this.getUrlByValueMethod(this.valueMethod);
    if (outputExpressionUrl !== extension.url) {
      const newOutputExtension = { ...extension };
      newOutputExtension.url = outputExpressionUrl;

      this.extensionsService.replaceExtensions(extension.url, [newOutputExtension]);
      this.questionnaire.item[itemIndex].extension = this.extensionsService.extensionsProp.value;
    }
  }

  /**
   * Return the expression url based on the value method.
   * @param valueMethod - "compute-initial", "compute-continuously" or "answer-expression".
   * @returns - expression url.
   */
  getUrlByValueMethod(valueMethod: string): string {
    if (this.formProperty.path === "/__$answerExpression") {
      return EXTENSION_URL_ANSWER_EXPRESSION;
    } else if (valueMethod === VALUE_METHOD_COMPUTE_INITIAL) {
      return EXTENSION_URL_INITIAL_EXPRESSION;
    } else if (valueMethod === VALUE_METHOD_COMPUTE_CONTINUOUSLY) {
      return EXTENSION_URL_CALCULATED_EXPRESSION;
    }
  }
  /**
   * Get extension
   * @param items - FHIR questionnaire item array
   * @param linkId - linkId of question where to extract expression
   */
  extractExtension(items, linkId): fhir.Extension []|null {
    for (const item of items) {
      if (item.linkId === linkId && item.extension) {
        return item.extension.filter(ext => ext.url)
      } else if (item.item) {
        const extension = this.extractExtension(item.item, linkId);
        if (extension !== null)
          return extension;
      }
    }

    return null;
  }

  /**
   * Get and remove the final expression
   * @param expressionUri - Expression extension URL
   * @param items - FHIR questionnaire item array
   * @param linkId - linkId of question where to extract expression
   */
  extractExpression(expressionUri, items, linkId): object|null {
    for (const item of items) {
      if (item.linkId === linkId && item.extension) {
        const extensionIndex = item.extension.findIndex((e) => {
          return e.url === expressionUri && e.valueExpression.language === this.LANGUAGE_FHIRPATH &&
            e.valueExpression.expression;
        });
        if (extensionIndex !== -1) {
          return item.extension[extensionIndex];
        }
      } else if (item.item) {
        const expression = this.extractExpression(expressionUri, item.item, linkId);
        if (expression !== null)
          return expression;
      }
    }
    return null;
  }



  /**
   * Open the Expression Editor widget to create/update variables and expression.
   */
  editExpression(): void {
    const modalConfig: NgbModalOptions = {
      size: 'lg',
      fullscreen: 'lg'
    };
    const itemIndex = this.questionnaire.item.findIndex(item => item.linkId === this.linkId);
    if (itemIndex > -1) {
      if (this.formProperty.value?.valueExpression?.expression) {
        this.questionnaire.item[itemIndex].extension = this.extensionsService.extensionsProp.value;
      }
    }
    const modalRef = this.modalService.open(ExpressionEditorDlgComponent, modalConfig);
    modalRef.componentInstance.linkId = this.formProperty.findRoot().getProperty('linkId').value;
    modalRef.componentInstance.expressionUri = this.schema.widget.expressionUri;
    modalRef.componentInstance.questionnaire = this.questionnaire;
    modalRef.componentInstance.display = this.schema.widget.displayExpressionEditorSections;
    modalRef.componentInstance.expressionLabel = this.schema.widget.expressionLabel;
    modalRef.result.then((result) => {
      // Result returning from the Expression Editor is the whole questionnaire.
      // Expression Editor returns false in the case changes were cancelled.
      if (result) {
        const resultExtensions = this.extractExtension(result.item, this.linkId);
        this.extensionsService.extensionsProp.reset(resultExtensions, false);
        const variables = this.extensionsService.getExtensionsByUrl(EXTENSION_URL_VARIABLE);

        const outputExtension = this.extensionsService.getFirstExtensionByUrl(this.schema.widget.expressionUri);
        this.expression = outputExtension?.valueExpression?.expression;
        this.formProperty.setValue(outputExtension, false);

        this.cdr.detectChanges();

        this.formProperty.findRoot().getProperty('__$variable').setValue(variables, false);
        this.formProperty.findRoot().getProperty('extension').setValue(resultExtensions, false);
      }
    });
  }
}

