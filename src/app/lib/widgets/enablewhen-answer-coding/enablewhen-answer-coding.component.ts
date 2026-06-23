/**
 * Answer coding component for enableWhen. The component is used for answer type coding for
 * selecting codes to satisfy a condition.
 */
import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import {ObjectWidget} from '@lhncbc/ngx-schema-form';
import {FormService} from '../../../services/form.service';
import fhir from 'fhir/r4';
import {Subscription} from 'rxjs';
import {AutoCompleteComponent, AutoCompleteOptions} from '../auto-complete/auto-complete.component';
import {FormsModule} from "@angular/forms";
import {SharedObjectService} from "../../../services/shared-object.service";
import { Util } from '../../util';
import { TYPE_CODING } from '../../constants/constants';
import { EnableWhenAnswerOptionsService } from '../../../services/enable-when-answer-options.service';
import { EnableWhenAnswerOptionsDirective } from '../../directives/enable-when-answer-options.directive';
import {
  DEFAULT_WIDGET_MODIFIED_MESSAGES,
  getModifiedErrorForPatternMismatch,
  mapWidgetErrors,
  ModifiedMessages,
  WidgetValidationError
} from '../../validation-utils';
declare var LForms: any;

@Component({
  selector: 'lfb-enablewhen-answer-coding',
  imports: [AutoCompleteComponent, FormsModule, EnableWhenAnswerOptionsDirective],
  providers: [EnableWhenAnswerOptionsService],
  template: `
    <div class="widget form-group form-group-sm m-0 p-0">
      @if (autoComplete) {
        <lfb-auto-complete [options]="acOptions" [model]="model" (selected)="modelChanged($event)" (removed)="modelChanged(null)"></lfb-auto-complete>
      } @else {
        <div class="p-0">
          <input lfbEnableWhenAnswerOptions
                 [enableWhenAnswerOptionsId]="id"
                 autocomplete="off"
                 type="text"
                 [attr.id]="id"
                 class="form-control form-control-sm" />
        </div>
      }
    </div>

    @if (errors?.length && !isFormPropertyEmpty()) {
      @for (error of errors; track error.code) {
        <small class="text-danger form-text" role="alert"
        >{{error.modifiedMessage || error.originalMessage}}</small>
      }
    }

  `,
  styles: [
  ]
})

export class EnablewhenAnswerCodingComponent extends ObjectWidget implements OnInit, AfterViewInit, OnDestroy {
  private formService = inject(FormService);
  private modelService = inject(SharedObjectService);
  enableWhenAnswerOptionsService = inject(EnableWhenAnswerOptionsService);

  subscriptions: Subscription [] = [];
  answerOptions: fhir.QuestionnaireItemAnswerOption [] = [];
  autoComplete = false;
  acOptions: AutoCompleteOptions = {
    acOptions: {
      matchListValue: true,
      maxSelect: 1,
      suggestionMode: LForms.Def.Autocompleter.NO_COMPLETION_SUGGESTIONS,
      autocomp: true,
      showListOnFocusIfEmpty: true,
      sort: false
    },
    fhirOptions: {
      fhirServer: null,
      valueSetUri: null,
      operation: '$expand',
      count: 7
    }
  }
  model: fhir.Coding;
  errors: WidgetValidationError[] | null = null;
  modifiedMessages: ModifiedMessages = DEFAULT_WIDGET_MODIFIED_MESSAGES;

  /**
   * Initializes the enableWhen answer coding widget and answer-option autocomplete service.
   *
   */
  ngOnInit() {
    const initValue = this.formProperty.value;
    if(initValue) {
      this.model = initValue;
    }
    this.init(this.formProperty.searchProperty('question').value);
    this.enableWhenAnswerOptionsService.init(this.formProperty, this.control);
  }


  /**
   * Initializes subscriptions for model synchronization, source question changes, and validation errors.
   *
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();

    let sub = this.formProperty.valueChanges.subscribe((newValue) => {
      if(this.formService.loading) {
        return;
      }
      this.init();
    });
    this.subscriptions.push(sub);

    // Listen to question value changes.
    sub = this.formProperty.searchProperty('question').valueChanges.subscribe((source) => {
      if(this.formService.loading) {
        return;
      }
      this.init();
    });
    this.subscriptions.push(sub);

    sub = this.modelService.modelInitialized$.subscribe(() => {
      this.init();
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = mapWidgetErrors(errors, this.modifiedMessages, {
        showEmptyError: !!this.schema.widget.showEmptyError,
        errorFilter: (error: any) => error.code.startsWith('ENABLEWHEN_')
      });
    });
    this.subscriptions.push(sub);
  }

  /**
   * Initializes answer coding choices for the selected enableWhen source question.
   *
   * @param sourceLinkId - Link id of the enableWhen source.
   */
  init(sourceLinkId = this.formProperty.searchProperty('question').value) {
    this.model = this.formProperty.value;
    this.answerOptions = [];
    this.autoComplete = false;
    const answerType = this.formProperty.searchProperty('__$answerType').value;

    if (answerType === 'coding') {
      const sourceNode = this.formService.getTreeNodeByLinkId(sourceLinkId);
      const answerValueSet = sourceNode?.data?.answerValueSet?.trim();
      this.autoComplete = !!answerValueSet;
      if(answerValueSet) {
        this.acOptions.fhirOptions.valueSetUri = decodeURI(answerValueSet);
        this.acOptions.fhirOptions.fhirServer = this.formService.getPreferredTerminologyServer(sourceNode);
      }
      else {
        this.answerOptions = this.processSourceAnswers(sourceNode?.data);
      }
    }
    this.model = !this.model && this.answerOptions?.length > 0 ? this.answerOptions[0] : this.model;
  }

  /**
   * Pick valid answers from the answerOption array.
   *
   * @param sourceItem - Source questionnaire item.
   * @returns Coding answer options that have either a code or display value.
   */
  processSourceAnswers(sourceItem: fhir.QuestionnaireItem): fhir.QuestionnaireItemAnswerOption [] {
    let ret: fhir.QuestionnaireItemAnswerOption [] = [];
    if(sourceItem?.answerOption?.length) {
      ret = (sourceItem?.answerOption)
        ? sourceItem.answerOption : [];
      ret = ret.filter((opt) => {
        return !!opt?.valueCoding?.code || !!opt?.valueCoding?.display;
      });
    }
    return ret;
  }

  /**
   * Handles model changes from the FHIR value set autocomplete.
   *
   * @param coding - Selected coding value, or null when the selection is removed.
   */
  modelChanged(coding: fhir.Coding) {
    this.model = coding || {};
    this.formProperty.reset(this.model, false);
  }


  /**
   * Call back for <select> tag to pick matching option for a given model.
   * For comparison, it prioritizes code equality before display equality.
   *
   * @param c1 - Option value
   * @param c2 - Model object to compare
   * @returns True if the two coding values represent the same selected option.
   */
  compareFn(c1: fhir.Coding, c2: fhir.Coding): boolean {
    return c1 && c2
      ? (c1.code && c2.code
        ? c1.code === c2.code
        : (c1.display === c2.display))
      : c1 === c2;
  }

  /**
   * Cleans up the answer-options service and component subscriptions.
   *
   */
  ngOnDestroy() {
    this.enableWhenAnswerOptionsService.destroy();
    this.subscriptions.forEach((sub) => {
      sub?.unsubscribe();
    })
  }

  /**
   * Finds a friendlier validation message for a known pattern mismatch.
   *
   * @param pattern - Pattern string from the validation error.
   * @returns A custom validation message when one is configured, otherwise null.
   */
  getModifiedErrorForPatternMismatch(pattern: string): string | null {
    return getModifiedErrorForPatternMismatch(pattern, this.modifiedMessages);
  }

  /**
   * Determines whether the form property value for a coding type is empty.
   *
   * Wraps the current form property value in a valueCoding structure and
   * delegates the emptiness check to the shared utility method based on
   * the CODING type.
   *
   * @returns true if the coding value is considered empty; otherwise false.
   */
  isFormPropertyEmpty():boolean {
    const valueCoding = { 'valueCoding': this.formProperty.value };
    return Util.isEmptyAnswerOptionForType([valueCoding], TYPE_CODING);
  }
}
