import { Component, Input, OnInit, AfterViewInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import { FormControl } from '@angular/forms';
import { FormService } from '../../../services/form.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ExpressionEditorDlgComponent } from '../expression-editor-dlg/expression-editor-dlg.component';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';

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
   * @param formService - Inject form service
   */
  constructor(private formService: FormService,
              private modalService: NgbModal,
              private cdr: ChangeDetectorRef,
              private modelService: SharedObjectService) {
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
  };

  ngAfterViewInit(): void {
    const item = this.formProperty.findRoot().value;
    this.name = this.formProperty.canonicalPathNotation;

    if ('extension' in item) {
      const exp = this.formService.getExpressionsExtensionByType(item.extension, this.name);
      if (exp) {
        this.expression = exp.valueExpression.expression;
        this.formProperty.setValue(exp, false);
      }
    } else if (this.formProperty.value) {
      const ext = this.formService.getExpressionsExtensionByType(this.formProperty.value, this.name);
      const itemIndex = this.questionnaire.item.findIndex(item => item.linkId === this.linkId);
      const sourceExtArray = this.formService.removeExpressionsExtensions(this.questionnaire.item[itemIndex].extension);
      this.expression = ext?.valueExpression?.expression;
      this.questionnaire.item[itemIndex].extension = [...sourceExtArray, ...this.formProperty.value];
      this.formProperty.findRoot().getProperty('extension').setValue(this.questionnaire.item[itemIndex].extension, false);
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
      if (this.formProperty.value) {
        const currentExtArray =this.formService.removeExpressionsExtensions(this.questionnaire.item[itemIndex].extension);
        this.questionnaire.item[itemIndex].extension = [...currentExtArray, this.formProperty.value];
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
        const resultExtension:any = this.extractExpression(this.schema.widget.expressionUri, result.item, this.linkId);

        const tmp = this.formService.getExpressionsExtensionByType(resultExtensions, this.name);

        const variables = this.formService.filterVariableExtensions(resultExtensions);
        this.formProperty.setValue(tmp, false);
        this.expression = resultExtension?.valueExpression?.expression;

        this.cdr.detectChanges();

        this.formProperty.findRoot().getProperty('__$variable').setValue(variables, false);
        this.formProperty.findRoot().getProperty('extension').setValue(resultExtensions, false);
      }
    });
  }
}

