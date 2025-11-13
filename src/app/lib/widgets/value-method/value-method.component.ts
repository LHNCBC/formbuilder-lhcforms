import { AfterViewInit, Component, OnInit, OnDestroy, inject } from '@angular/core';
import {FormService} from '../../../services/form.service';
import { Subscription } from 'rxjs';
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";
import { Util } from '../../util';
import { ExtensionsService } from 'src/app/services/extensions.service';
import * as CONSTANTS from '../../constants/constants';


@Component({
  standalone: false,
  selector: 'lfb-value-method',
  templateUrl: './value-method.component.html'
})
export class ValueMethodComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  type = CONSTANTS.TYPE_STRING;
  linkId: string;
  answerOptions;
  subscriptions: Subscription[] = [];
  isAnswerList = false;
  displayTypeInitial = true;
  displayPickInitial = true;
  answerOptionMethod = CONSTANTS.ANSWER_OPTION_METHOD_ANSWER_OPTION;
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
      ext.url === CONSTANTS.EXTENSION_URL_INITIAL_EXPRESSION ||
      ext.url === CONSTANTS.EXTENSION_URL_CALCULATED_EXPRESSION ||
      ext.url === CONSTANTS.EXTENSION_URL_ANSWER_EXPRESSION
    );

    const oneOf = this.formProperty.schema.oneOf;
    const setOptions = (opts: any[], value: string) => {
      this.valueMethodOptions = opts;
      this.formProperty.setValue(value, false);
    };

    if (expression[0]?.url === CONSTANTS.EXTENSION_URL_INITIAL_EXPRESSION) {
      setOptions(isAnswerList ? oneOf.slice(1) : [...oneOf.slice(0, 1), ...oneOf.slice(2)], CONSTANTS.VALUE_METHOD_COMPUTE_INITIAL);
    } else if (expression[0]?.url === CONSTANTS.EXTENSION_URL_CALCULATED_EXPRESSION) {
      setOptions(isAnswerList ? oneOf.slice(1) : [...oneOf.slice(0, 1), ...oneOf.slice(2)], CONSTANTS.VALUE_METHOD_COMPUTE_CONTINUOUSLY);
    } else if (
      type === CONSTANTS.TYPE_BOOLEAN ||
      (
        answerOptionMethod === CONSTANTS.ANSWER_OPTION_METHOD_ANSWER_OPTION &&
        answerOptions?.length > 0 &&
        answerOptions.some(opt => "initialSelected" in opt)
      ) ||
      (
        (answerOptionMethod === CONSTANTS.ANSWER_OPTION_METHOD_SNOMED_VALUE_SET ||
        answerOptionMethod === CONSTANTS.ANSWER_OPTION_METHOD_VALUE_SET) &&
        initial.length > 0
      )
    ) {
      setOptions(oneOf.slice(1), CONSTANTS.VALUE_METHOD_PICK_INITIAL);
    } else if (answerOptionMethod === CONSTANTS.ANSWER_OPTION_METHOD_ANSWER_EXPRESSION) {
      setOptions([...oneOf.slice(0, 1), ...oneOf.slice(2)], CONSTANTS.VALUE_METHOD_TYPE_INITIAL);
    } else if (type === CONSTANTS.TYPE_CODING && Util.isEmptyAnswerOptionForType(answerOptions, type)) {
      setOptions(oneOf.slice(1), CONSTANTS.VALUE_METHOD_NONE);
    } else if (initial.length > 0 && !Util.isEmptyInitialForType(initial, type) && type !== CONSTANTS.TYPE_CODING) {
      setOptions([...oneOf.slice(0, 1), ...oneOf.slice(2)], CONSTANTS.VALUE_METHOD_TYPE_INITIAL);
    } else {
      setOptions(isAnswerList ? oneOf.slice(1) : [...oneOf.slice(0, 1), ...oneOf.slice(2)], CONSTANTS.VALUE_METHOD_NONE);
    }
    this.displayTypeInitial = ((answerOptionMethod === CONSTANTS.ANSWER_OPTION_METHOD_ANSWER_EXPRESSION && isAnswerList) || !isAnswerList);
    this.displayPickInitial = !this.displayTypeInitial;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub: Subscription;

    sub = this.formProperty.searchProperty('/__$isAnswerList').valueChanges.subscribe((isAnswerList) => {
      this.isAnswerList = isAnswerList;

      if (this.type === CONSTANTS.TYPE_STRING) {
        this.type = this.formProperty.findRoot().getProperty('type').value;
      }

      this.updateValueMethodOptions(this.type, this.answerOptionMethod, isAnswerList);
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('type').valueChanges.subscribe((typeVal) => {
      this.type = typeVal;

      if (typeVal === CONSTANTS.TYPE_DECIMAL || typeVal === CONSTANTS.TYPE_DATETIME || typeVal === CONSTANTS.TYPE_URL ||
          typeVal === CONSTANTS.TYPE_QUANTITY || typeVal === CONSTANTS.TYPE_GROUP || typeVal === CONSTANTS.TYPE_DISPLAY) {
        this.isAnswerList = false;
        this.formProperty.searchProperty('__$isAnswerList').setValue(false, false);
      }

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

        if ((val === CONSTANTS.VALUE_METHOD_COMPUTE_INITIAL || val === CONSTANTS.VALUE_METHOD_COMPUTE_CONTINUOUSLY) && this.formService.isFocusNodeHasError()) {
          // Check to see if this item has an error. This is the case where users is switching between
          // Value Method options. The 'Type initial value' or 'Pick initial value' may have validation
          // errors. But the 'Compute initial value' or 'Continuously compute value' do not have validation.
          // Therefore, if there is an error, it needs to be cleared out.
          const node  = this.formService.getTreeNodeByLinkId(this.linkId);
          this.formService.updateValidationStatus(node.data.__$treeNodeId, this.linkId, "*", null);
          this.formService._validationStatusChanged$.next(null);
        }

        // When switching to "pick-initial" or "type-initial" or "None" value methods (and not using "answer-expression"),
        // remove any lingering answer expression-related extensions from the root 'extension' property
        // to ensure the form state is consistent and does not retain
        if ((val !== CONSTANTS.VALUE_METHOD_COMPUTE_INITIAL && val !== CONSTANTS.VALUE_METHOD_COMPUTE_CONTINUOUSLY) && this.answerOptionMethod !== CONSTANTS.ANSWER_OPTION_METHOD_ANSWER_EXPRESSION) {
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
