import { Component, Input, OnInit, AfterViewInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import { FormControl } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ExpressionEditorDlgComponent } from '../expression-editor-dlg/expression-editor-dlg.component';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import { ExtensionsService } from 'src/app/services/extensions.service';

@Component({
  selector: 'lfb-expression-editor',
  templateUrl: './expression-editor.component.html',
  styleUrl: './expression-editor.component.css'
})
export class ExpressionEditorComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {
  @Input() model: any;
  @Input() exp: string;
  @Output() questionnaireChange = new EventEmitter<fhir4.Questionnaire>();
  subscriptions: Subscription[] = [];

  elementId: string;
  control = new FormControl();
  questionnaire = null;
  private LANGUAGE_FHIRPATH = 'text/fhirpath';
  linkId: string;
  expression: string;
  valueMethod: string;
  itemId: number;
  faAdd = faPlusCircle;
  name: string;
  /**
   * Invoke super constructor.
   *
   */
  constructor(private modalService: NgbModal,
              private cdr: ChangeDetectorRef,
              private modelService: SharedObjectService,
              private extensionsService: ExtensionsService) {
    super();
  }

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    this.modelService.questionnaire$.subscribe((questionnaire) => {
      this.questionnaire = questionnaire;
    });

    this.itemId = this.formProperty.findRoot().getProperty('id').value;
    this.linkId = this.formProperty.findRoot().getProperty('linkId').value;
    this.valueMethod = this.formProperty.findRoot().getProperty('__$valueMethod').value;

    const extensions = this.formProperty.findRoot().getProperty('extension');
    if (extensions && extensions?.value.length > 0) {
      this.extensionsService.setExtensions(extensions);
    }
  };

  ngAfterViewInit(): void {
    const item = this.formProperty.findRoot().value;
    this.name = this.formProperty.canonicalPathNotation;
    const itemIndex = this.questionnaire.item.findIndex(item => item.linkId === this.linkId);

    if ('extension' in item) {
      const exp = this.extensionsService.getFirstExtensionByUrl(ExtensionsService.INITIAL_EXPRESSION) ||
                  this.extensionsService.getFirstExtensionByUrl(ExtensionsService.CALCULATED_EXPRESSION);
      if (exp) {
        this.expression = exp.valueExpression.expression;
        this.formProperty.setValue(exp, false);

        this.updateOutputExtensionUrl(exp, itemIndex);
      } else if (this.formProperty.value) {
        this.expression = this.formProperty.value?.valueExpression?.expression;
      }
    }
  }

  /**
   * Update the output extension url of a questionnaire item based on the selected value method.
   * @param extension - the current extension object that needs to be updated.
   * @param itemIndex - the index of the item in the questionnaire that is being updated.
   */
  updateOutputExtensionUrl(extension: any, itemIndex: any): void {
    if (this.getUrlByValueMethod(this.valueMethod) !== extension.url) {
      const newOutputExtension = { ...extension };
      newOutputExtension.url = this.getUrlByValueMethod(this.valueMethod);

      this.extensionsService.replaceExtensions(extension.url, [newOutputExtension]);
      this.questionnaire.item[itemIndex].extension = this.extensionsService.extensionsProp.value;
    }
  }

  /**
   * Return the expression url based on the value method.
   * @param valueMethod - "compute-initial" or "compute-continuously".
   * @returns - expression url.
   */
  getUrlByValueMethod(valueMethod: string): string {
    return (valueMethod === "compute-initial") ? ExtensionsService.INITIAL_EXPRESSION : ExtensionsService.CALCULATED_EXPRESSION;
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
    modalRef.result.then((result) => {
      // Result returning from the Rule Editor is the whole questionnaire.
      // Rule Editor returns false in the case changes were cancelled.
      if (result) {
        const resultExtensions = this.extractExtension(result.item, this.linkId);
        this.extensionsService.extensionsProp.reset(resultExtensions, false);
        const variables = this.extensionsService.getExtensionsByUrl(ExtensionsService.VARIABLE);

        const outputExtension = this.extensionsService.getFirstExtensionByUrl(this.getUrlByValueMethod(this.valueMethod));
        this.expression = outputExtension?.valueExpression?.expression;
        this.formProperty.setValue(outputExtension, false);

        this.cdr.detectChanges();

        this.formProperty.findRoot().getProperty('__$variable').setValue(variables, false);
        this.formProperty.findRoot().getProperty('extension').setValue(resultExtensions, false);
      }
    });
  }
}

