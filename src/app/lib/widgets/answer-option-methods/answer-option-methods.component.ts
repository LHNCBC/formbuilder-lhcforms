import {AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AnswerOptionComponent} from '../answer-option/answer-option.component';
import {StringComponent} from '../string/string.component';
import {LabelRadioComponent} from '../label-radio/label-radio.component';
import {AnswerValueSetComponent} from '../answer-value-set/answer-value-set.component';
import {FormService} from '../../../services/form.service';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {Subscription} from 'rxjs';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { TableService, TableStatus } from 'src/app/services/table.service';
import {
  ANSWER_OPTION_METHOD_ANSWER_OPTION, ANSWER_OPTION_METHOD_SNOMED_VALUE_SET, ANSWER_OPTION_METHOD_VALUE_SET, ANSWER_OPTION_METHOD_ANSWER_EXPRESSION,
  EXTENSION_URL_ANSWER_EXPRESSION
} from '../../constants/constants';

@Component({
  standalone: false,
  selector: 'lfb-answer-option-methods',
  templateUrl: './answer-option-methods.component.html'
})
export class AnswerOptionMethodsComponent extends LabelRadioComponent implements OnInit, AfterViewInit, OnDestroy {

  subscriptions: Subscription [] = [];
  @ViewChild('answerOption', {static: true, read: AnswerOptionComponent}) answerOption: AnswerOptionComponent;
  @ViewChild('answerValueSet', {static: true, read: StringComponent}) answerValueSet: StringComponent;
  isSnomedUser = false;
  answerOptionMethod = null;
  type = 'string';
  isAnswerList = false;
  extensionsService: ExtensionsService = inject(ExtensionsService);
  tableService = inject(TableService);

  liveAnnouncer = inject(LiveAnnouncer);

  constructor(private formService: FormService) {
    super();
  }

  /**
   * Initialize
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.isSnomedUser = this.formService.isSnomedUser();
    this.updateUI();
  }

  /**
   * Returns the list of answer option methods that should be available for selection,
   * filtered based on the current user context and item configuration.
   *
   * - For SNOMED users, includes options where the supported data type is 'all' or matches the current type,
   *   and only if the item is configured as an answer list.
   * - For non-SNOMED users, excludes the 'snomed-value-set' option.
   *
   * @returns An array of answer option method schema objects that are valid for the current context.
   */
  get filteredAnswerOptionMethods(): any[] {
    return this.schema.oneOf.filter(option => {
      if (this.isSnomedUser) {
        return (
          (this.schema.widget.supportedDataType[option.enum[0]][0] === 'all' ||
          this.isTypeSupportedForKey(option.enum[0], this.type)) &&
          this.isAnswerList
        );
      } else {
        return option.enum[0] !== 'snomed-value-set';
      }
    });
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();

    let sub: Subscription;

    sub = this.formProperty.valueChanges.subscribe((ansOptMethod) => {
      if (ansOptMethod === ANSWER_OPTION_METHOD_ANSWER_EXPRESSION) {
        const warningMessage = 'Validation and automatic lookup for Answer Expression are not available. The expression cannot be checked, and initial values must be entered manually.';

        const status: TableStatus = {
          type: 'warning',
          message: warningMessage
        };
        this.tableService.setTableStatusChanged(status);
      } else {
        // If switching away from "answer-expression" method, remove any answer expression-related
        // extensions from the root 'extension' property to keep the form state consistent.
        if (this.answerOptionMethod && this.answerOptionMethod === ANSWER_OPTION_METHOD_ANSWER_EXPRESSION && ansOptMethod !== this.answerOptionMethod) {
          const exts = this.formProperty.findRoot().getProperty('extension').value;
          const updatedExts = this.extensionsService.removeExpressionExtensions();
          if (updatedExts && exts && updatedExts.length !== exts.length) {
            this.formProperty.findRoot().getProperty('extension').setValue(updatedExts, false);
          }
        }

        // Clear previous status to force UI update
        this.tableService.setTableStatusChanged(null);
      }

      this.answerOptionMethod = ansOptMethod;
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.findRoot().getProperty('type').valueChanges.subscribe((type) => {
      this.type = type;
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.findRoot().getProperty('__$isAnswerList').valueChanges.subscribe((isAnswerList) => {
      this.isAnswerList = isAnswerList;

      if (!this.isAnswerList) {
        this.tableService.setTableStatusChanged(null);
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Change handler.
   */
  handleChange() {
    let message = '';

    switch (this.formProperty.value) {
      case ANSWER_OPTION_METHOD_ANSWER_OPTION:
        message = `Fields for answer options are displayed below.`;
        break;
      case ANSWER_OPTION_METHOD_SNOMED_VALUE_SET:
        message = `Fields for a SNOMED CT answer value set are displayed below.`;
        break;
      case ANSWER_OPTION_METHOD_VALUE_SET:
        message = `A field for an answer value set URI is displayed below.`;
        break;
      case ANSWER_OPTION_METHOD_ANSWER_EXPRESSION:
        message = `A field for an answer expression is displayed below.`;
        break;
    }
    this.liveAnnouncer.announce(message).then(r => {});
  }


  /**
   * Update UI widgets with initial value. The widget(s) is directly controlled by form property of __$answerOptionMethods. This
   * form property is internal. The snomed answer radio option may depend on the value of answerValueSet,
   * in which case it will update the formProperty of __$answerOptionMethods.
   */
  updateUI() {
    const valueSetUrl = this.formProperty.searchProperty('answerValueSet').value;
    if(valueSetUrl?.length > 0) {
      let valueSetType = ANSWER_OPTION_METHOD_VALUE_SET;
      if(this.isSnomedUser &&
        (valueSetUrl.startsWith(AnswerValueSetComponent.snomedBaseUri))) {
        valueSetType = ANSWER_OPTION_METHOD_SNOMED_VALUE_SET;
      }
      this.formProperty.setValue(valueSetType, false);
    } else {
      const answerExpressionExtension = this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_ANSWER_EXPRESSION);
      if (answerExpressionExtension) {
        this.formProperty.setValue(ANSWER_OPTION_METHOD_ANSWER_EXPRESSION, false);
      }
    }
  }

  /**
   * Checks if the specified FHIR data type is supported for a given key in the widget's supportedDataType map.
   *
   * @param supportedKey - The key to look up in the supportedDataType object (e.g., 'answerOption', 'valueSet', etc.).
   * @param type - The FHIR data type to check for support (e.g., 'string', 'coding', etc.).
   * @returns True if the type is supported for the given key; otherwise, false.
   */
  isTypeSupportedForKey(supportedKey: string, type: string): boolean {
    return this.schema.widget.supportedDataType[supportedKey].indexOf(type) > -1;
  }

  /**
   * Angular lifecycle hook
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
