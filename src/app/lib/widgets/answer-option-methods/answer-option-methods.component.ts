import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {LabelRadioComponent} from '../label-radio/label-radio.component';
import {FormService} from '../../../services/form.service';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {Subscription} from 'rxjs';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { TableService, TableStatus } from 'src/app/services/table.service';
import {
  ANSWER_OPTION_METHOD_ANSWER_OPTION, ANSWER_OPTION_METHOD_SNOMED_VALUE_SET, ANSWER_OPTION_METHOD_VALUE_SET, ANSWER_OPTION_METHOD_ANSWER_EXPRESSION
} from '../../constants/constants';
import {SharedObjectService} from "../../../services/shared-object.service";
import {SchemaFormModule} from "@lhncbc/ngx-schema-form";
import {LabelComponent} from "../label/label.component";
import {ReactiveFormsModule} from "@angular/forms";
import {NgClass} from "@angular/common";

@Component({
  selector: 'lfb-answer-option-methods',
  imports: [ReactiveFormsModule, SchemaFormModule, LabelComponent, NgClass],
  templateUrl: './answer-option-methods.component.html'
})
export class AnswerOptionMethodsComponent extends LabelRadioComponent implements OnInit, AfterViewInit {
  extensionsService: ExtensionsService = inject(ExtensionsService);
  tableService = inject(TableService);
  modelService = inject(SharedObjectService);
  private formService = inject(FormService);
  // private liveAnnouncer = inject(LiveAnnouncer);

  isSnomedUser = false;
  answerOptionMethod = null;

  /**
   * Initialize
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.isSnomedUser = this.formService.isSnomedUser();
    this.init();
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
        if (option.enum[0] === "none") {
          return true;
        } else {
          const type = this.formProperty.searchProperty('/type').value;
          const isAnswerList = this.formProperty.searchProperty('/__$isAnswerList').value;
          return (
            (this.schema.widget.supportedDataType[option.enum[0]][0] === 'all' ||
            this.isTypeSupportedForKey(option.enum[0], type)) &&
            isAnswerList
          );
        }
      } else {
        return option.enum[0] !== 'snomed-value-set';
      }
    });
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();

    let sub: Subscription;

    sub = this.formProperty.valueChanges.subscribe(() => {
      if(this.formService.loading) {
        return;
      }
      this.init();
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.findRoot().getProperty('__$isAnswerList').valueChanges.subscribe((isAnswerList) => {
      if (!isAnswerList) {
        this.tableService.setTableStatusChanged(null);
      }
    });
    this.subscriptions.push(sub);

    this.modelService.modelInitialized$.subscribe(model => {
      this.init();
    });
  }

  /**
   * Initialize component on value change. Called at init, update of value, and switching of model.
   */
  init() {
    const ansOptMethod = this.formProperty.value;
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
        this.extensionsService.removeExpressionExtensions();
      }

      // Clear previous status to force UI update
      this.tableService.setTableStatusChanged(null);
    }

    this.answerOptionMethod = ansOptMethod;
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
   * Checks if the specified FHIR data type is supported for a given key in the widget's supportedDataType map.
   *
   * @param supportedKey - The key to look up in the supportedDataType object (e.g., 'answerOption', 'valueSet', etc.).
   * @param type - The FHIR data type to check for support (e.g., 'string', 'coding', etc.).
   * @returns True if the type is supported for the given key; otherwise, false.
   */
  isTypeSupportedForKey(supportedKey: string, type: string): boolean {
    return this.schema.widget.supportedDataType[supportedKey].indexOf(type) > -1;
  }
}
