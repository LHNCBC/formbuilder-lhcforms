import { AfterViewInit, Component, OnInit, OnDestroy, inject } from '@angular/core';
import {FormService} from '../../../services/form.service';
import { Subscription } from 'rxjs';
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";
import { Util } from '../../util';
import { ExtensionsService } from 'src/app/services/extensions.service';

@Component({
  standalone: false,
  selector: 'lfb-value-method',
  templateUrl: './value-method.component.html'
})
export class ValueMethodComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  type = "string";
  linkId: string;
  answerOptions;
  subscriptions: Subscription[] = [];
  isAnswerList = false;
  displayTypeInitial = true;
  displayPickInitial = true;
  answerOptionMethod = "answer-option";
  currentValueMethod: string;

  valueMethodOptions: any[];
  extensionsService: ExtensionsService = inject(ExtensionsService);

  constructor(private formService: FormService) {
    super();
  }

  /**
   * Initialize
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.currentValueMethod = this.formProperty.value;
    this.linkId = this.formProperty.findRoot().getProperty('linkId').value;
  }

  /**
   * Updates the available value method options and sets the appropriate control value
   * based on the current type, answer option method, and whether the item is an answer list.
   * This function determines which value method options should be shown to the user,
   * and sets the control and form property values accordingly.
   * It also updates display flags for the UI.
   *
   * @param type - The data type of the item (e.g., 'boolean', 'coding', etc.)
   * @param answerOptionMethod - The method used for answer options (e.g., 'answer-option', 'answer-expression', etc.)
   * @param isAnswerList - Whether the item is configured as an answer list
   */
  private updateValueMethodOptions(type: string, answerOptionMethod: string, isAnswerList: boolean) {
    
    const initial = this.formProperty.findRoot().getProperty('initial').value;
    const answerOptions = this.formProperty.findRoot().getProperty('answerOption').value;
    const extensions = this.extensionsService.extensionsProp.value;

    const expression = extensions.filter(ext =>
      ext.url === ExtensionsService.INITIAL_EXPRESSION ||
      ext.url === ExtensionsService.CALCULATED_EXPRESSION ||
      ext.url === ExtensionsService.ANSWER_EXPRESSION
    );

    // if the expression is available and it is an initial expression
    if (expression[0]?.url === ExtensionsService.INITIAL_EXPRESSION) {
      this.valueMethodOptions = this.formProperty.schema.oneOf.slice(1);
      this.control.setValue("compute-initial", { emitEvent: true });
      this.formProperty.setValue("compute-initial", false);
    // if the expression is available and it is a calculated expression
    } else if (expression[0]?.url === ExtensionsService.CALCULATED_EXPRESSION) {
      this.valueMethodOptions = this.formProperty.schema.oneOf.slice(1);
      this.control.setValue("compute-continuously", { emitEvent: true });
      this.formProperty.setValue("compute-continuously", false);
    // if type is boolean or 
    // answer option method = answer-option and there are answer choices, and intial values or
    // answer option method = snomed-value-set or value set, and initial values  
    } else if ((type === 'boolean') ||
               ((answerOptionMethod === 'answer-option' && answerOptions?.length > 0 && answerOptions.some(opt => "initialSelected" in opt)) ||
                ((answerOptionMethod === 'snomed-value-set' || answerOptionMethod === 'value-set') && initial.length > 0))) {
      this.valueMethodOptions = this.formProperty.schema.oneOf.slice(1);
      this.control.setValue("pick-initial", { emitEvent: true });
      this.formProperty.setValue("pick-initial", false);
    // answer option method = answer-expression  
    } else if (answerOptionMethod === "answer-expression" || expression[0]?.url === ExtensionsService.ANSWER_EXPRESSION) {
      this.valueMethodOptions = [this.formProperty.schema.oneOf[0], this.formProperty.schema.oneOf[this.formProperty.schema.oneOf.length - 1]];
      this.control.setValue("type-initial", { emitEvent: true });
      this.formProperty.setValue("type-initial", false);
    } else if (type === "coding" && Util.isEmptyAnswerOptionForType(answerOptions, type)) {
      this.valueMethodOptions = this.formProperty.schema.oneOf.slice(1);
      this.control.setValue("none", { emitEvent: true });
      this.formProperty.setValue("none", false);
    } else if (initial.length > 0 && type !== 'coding') {
      this.valueMethodOptions = [...this.formProperty.schema.oneOf.slice(0, 1), ...this.formProperty.schema.oneOf.slice(2)];
      this.control.setValue("type-initial", { emitEvent: true });
      this.formProperty.setValue("type-initial", false);
    } else {
      if (isAnswerList) {
        this.valueMethodOptions = this.formProperty.schema.oneOf.slice(1);
      } else {
        this.valueMethodOptions = [...this.formProperty.schema.oneOf.slice(0, 1), ...this.formProperty.schema.oneOf.slice(2)];
      }
      this.control.setValue("none", { emitEvent: true });
      this.formProperty.setValue("none", false);
    }
    this.displayTypeInitial = ((answerOptionMethod === "answer-expression" && isAnswerList) || !isAnswerList);
    this.displayPickInitial = !this.displayTypeInitial;
  }
  
  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub: Subscription;

    sub = this.formProperty.searchProperty('/__$isAnswerList').valueChanges.subscribe((isAnswerList) => {
      this.isAnswerList = isAnswerList;

      this.updateValueMethodOptions(this.type, this.answerOptionMethod, isAnswerList);
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('type').valueChanges.subscribe((typeVal) => {
      this.type = typeVal;

      if (typeVal === "decimal" || typeVal === "dateTime" || typeVal === "url" || typeVal === "quantity" ||
          typeVal === "group" || typeVal === "display") {
        this.isAnswerList = false;
        this.formProperty.searchProperty('__$isAnswerList').setValue(false, false);
      }
/*       
      else if (typeVal === "coding" && Util.isEmptyAnswerOptionForType(answerOptions, typeVal)) {
        this.valueMethodOptions = this.valueMethodOptions.slice(1);
        this.control.setValue("none", { emitEvent: true });
        this.formProperty.setValue("none", false);
      } else if (typeVal === "boolean") {
        this.valueMethodOptions = this.valueMethodOptions.slice(1);
        this.control.setValue("pick-initial", { emitEvent: true });
        this.formProperty.setValue("pick-initial", false);
      } else {
        const answerOptions = this.formProperty.findRoot().getProperty('answerOption').value;
        if (answerOptions && answerOptions.length > 0) {
          this.formProperty.searchProperty('__$isAnswerList').setValue(true, false);
        }
      } */
      
      this.updateValueMethodOptions(typeVal, this.answerOptionMethod, this.isAnswerList);
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('/__$answerOptionMethods').valueChanges.subscribe((method) => {
      this.answerOptionMethod = method;

      this.updateValueMethodOptions(this.type, method, this.isAnswerList);
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.valueChanges.subscribe((val) => {
      const changed = val !== this.currentValueMethod;

      if (changed) {
        this.currentValueMethod = val;
        this.formProperty.setValue(val, false);

        const exts = this.formProperty.findRoot().getProperty('extension').value;

        if ((val === "compute-initial" || val === "compute-continuously") && this.formService.isFocusNodeHasError()) {
          // Check to see if this item has an error. This is the case where users is switching between 
          // Value Method options. The 'Type initial value' or 'Pick initial value' may have validation 
          // errors. But the 'Compute initial value' or 'Continuously compute value' do not have validation.
          // Therefore, if there is an error, it needs to be cleared out.
          const node  = this.formService.getTreeNodeByLinkId(this.linkId);
          this.formService.updateValidationStatus(node.data.__$treeNodeId, this.linkId, "*", null);
          this.formService._validationStatusChanged$.next(null);
        }

        if (val === "pick-initial" || val === "type-initial") {
          const updatedExts = this.formService.removeExpressionsExtensions(exts);
          if (updatedExts.length !== exts.length) {
            this.formProperty.findRoot().getProperty('extension').setValue(updatedExts, false);
          }
        }
      }
    });
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
