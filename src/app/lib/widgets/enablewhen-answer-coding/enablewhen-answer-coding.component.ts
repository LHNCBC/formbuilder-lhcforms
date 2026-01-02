/**
 * Answer coding component for enableWhen. The component is used for answer type coding for
 * selecting codes to satisfy a condition.
 */
import {AfterViewInit, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {FormService} from '../../../services/form.service';
import fhir from 'fhir/r4';
import {Subscription} from 'rxjs';
import { AutoCompleteOptions } from '../auto-complete/auto-complete.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { LfbOptionControlWidgetComponent } from '../lfb-option-control-widget/lfb-option-control-widget.component';
import { Util } from '../../util';
import { TYPE_CODING } from '../../constants/constants';
declare var LForms: any;

@Component({
  standalone: false,
  selector: 'lfb-enablewhen-answer-coding',
  template: `
    <div class="widget form-group form-group-sm m-0 p-0">
      <ng-container *ngIf="autoComplete; else answerOption">
        <lfb-auto-complete [options]="acOptions" [model]="model" (selected)="modelChanged($event)" (removed)="modelChanged(null)"></lfb-auto-complete>
      </ng-container>
    </div>

    <ng-template #answerOption>
      <div class="p-0">
        <input autocomplete="off" #enableWhenAnswerOptions type="text" [attr.id]="id" class="form-control" (input)="onInput($event)" (blur)="suppressInvalidValue($event)" />
      </div>
    </ng-template>
    <ng-container *ngFor="let error of errors">
      <small *ngIf="!isFormPropertyEmpty() && error"
              class="text-danger form-text" role="alert"
      >{{error.modifiedMessage || error.originalMessage}}</small>
    </ng-container>
  `,
  styles: [
  ]
})
export class EnablewhenAnswerCodingComponent extends LfbOptionControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {

  subscriptions: Subscription [] = [];
  answerOptions: any[] = [];
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

  liveAnnouncer = inject(LiveAnnouncer);

  /**
   * Invoke super constructor.
   *
   * @param formService - Inject form service
   */
  constructor(private formService: FormService) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();

    const initValue = this.formProperty.value;
    if(initValue) {
      this.model = initValue;
    }
    this.init(this.formProperty.searchProperty('question').value);
  }


  /**
   * Component initialization.
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();

    let sub = this.formProperty.valueChanges.subscribe((newValue) => {
      this.model = newValue;
    });
    this.subscriptions.push(sub);

    // Listen to question value changes.
    sub = this.formProperty.searchProperty('question').valueChanges.subscribe((source) => {
      this.init(source);
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = null;
      if (errors?.length) {
        const errorsObj = {};
        errors.reduce((acc, error) => {
          if (error.code.startsWith('ENABLEWHEN_') && !acc[error.code]) {
            acc[error.code] = error;
          }

          return acc;
        }, errorsObj);

        this.errors = Object.values(errorsObj)
          .map((e: any) => {
          let ret = {code: e.code, originalMessage: e.message, modifiedMessage: null};
          if(!e.params[1]?.trim() && this.schema.widget.showEmptyError) {
            // If the error is caused by an empty value, use a generic message.
            ret.code = 'EMPTY_ERROR';
            ret.modifiedMessage = 'This field is required.';
          } else {
            const modifiedMessage = e.code === 'PATTERN'
              ? this.getModifiedErrorForPatternMismatch(e.params[0])
              : this.modifiedMessages[e.code];
            ret.code = e.code;
            ret.originalMessage = e.message;
            ret.modifiedMessage = modifiedMessage;
          }
          return ret;
        });
      }
    });
    this.subscriptions.push(sub);

  }


  /**
   * Initialize the auto-complete widget
   * @param sourceLinkId - Link id of the enableWhen source.
   */
  init(sourceLinkId: string) {
    this.answerOptions = [];
    this.autoComplete = false;
    if (!sourceLinkId) {
      // reset the model and value if the linkId is not available
      this.model = {};
      this.formProperty.reset(this.model, false);
      return;
    }
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
   * @param sourceItem - Source item
   */
  processSourceAnswers(sourceItem: fhir.QuestionnaireItem): any [] {
    let ret = [];
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
   * Handles the input event for the enableWhen date input field.
   * Updates the formProperty value to match the UI input, triggering standard validation.
   * Also triggers custom enableWhen validation after the value is set.
   *
   * @param event - The input event from the date input element.
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    setTimeout(() => {
      // Set the formProperty value to match the UI input.
      // This will trigger the standard validation.
      if (this.formProperty) {
        const newCoding = this.parseCoding(input.value);

        this.formProperty.setValue(newCoding, true);
        // Trigger the custom enableWhen validation
        this.formProperty.updateValueAndValidity(false, true);
      }
    }, 0);
  }

  /**
   * Reset formProperty if input box has invalid date format.
   * Intended to be invoked on blur event of an input box.
   * @param event - DOM event
   */
  suppressInvalidValue(event: Event) {
    const inputEl = event.target as HTMLInputElement;

    if(inputEl.classList.contains('ng-invalid')) {
      this.formProperty.setValue(null, false);
    } else if (this.findParentTdWithInvalid(inputEl)) {
      inputEl.value = '';
      this.formProperty.setValue(null, false);
    }
  }

  /**
   * Handle model change event in <select> tag.
   * @param coding - Option value
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
   */
  compareFn(c1: fhir.Coding, c2: fhir.Coding): boolean {
    return c1 && c2
      ? (c1.code && c2.code
        ? c1.code === c2.code
        : (c1.display === c2.display))
      : c1 === c2;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub?.unsubscribe();
    })
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
