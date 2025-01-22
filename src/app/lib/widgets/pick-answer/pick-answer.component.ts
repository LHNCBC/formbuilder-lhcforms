import {AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import Def from 'autocomplete-lhc';
import {BehaviorSubject, debounceTime, distinctUntilChanged, of, startWith, Subscription} from 'rxjs';
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";

import { HttpParams } from "@angular/common/http";
import { FormService } from 'src/app/services/form.service';
import { AnswerOptionService } from 'src/app/services/answer-option.service';

@Component({
  selector: 'lfb-pick-answer',
  templateUrl: './pick-answer.component.html'
})

export class PickAnswerComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild('autoComplete') autoCompleteElement;

  static snomedValueSetUrl = "https://snowstorm.ihtsdotools.org/fhir/ValueSet/$expand?url=";
  private _loading$ = new BehaviorSubject<string | null>(null);

  autoComplete;

  answerOptionProp;
  answerOptionDisplays;
  answerValueSets;

  opts: any = {
    maxSelect: 1
  }
  ansOptMethod;

  subscriptions: Subscription[] = [];

  itemId: number;
  linkId: string;
  isRepeating: boolean;

  autoCompleteEventsUnsubscribe: () => void;

  protected readonly warningIcon = faExclamationTriangle;
  errors: {code: string, originalMessage: string, modifiedMessage: string} [] = null;
  errorIcon = faExclamationTriangle;

  options: {params?: HttpParams, observe: 'response', responseType: 'json'} = {
    observe: 'response',
    responseType: 'json',
    params: (new HttpParams())
      .set('_format', 'json')
      .set('_elements', 'fhirVersion,implementation') // Gives a small response. Is this reliable?
  };

  constructor( private cdr: ChangeDetectorRef,
               private formService: FormService,
               private answerOptionService: AnswerOptionService) {
    super();
  }

  // Loading spinner
  get loading$() { return this._loading$.asObservable(); }

  updateLoadingStatus(status:string | null) {
    this._loading$.next(status);
  }

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    super.ngOnInit();

    this.itemId = this.formProperty.findRoot().getProperty('id').value;
    this.linkId = this.formProperty.findRoot().getProperty('linkId').value;
  }

  /**
   * After the autocompleter is ready to be interacted with fetch the name for
   * any codes already in the query search.
   */
  ngAfterViewInit(): void {
    let sub: Subscription;

    // 'Answer list source' field
    // Three possible values: answer-option, snomed-valueset, and value-set
    sub = this.formProperty.searchProperty('__$answerOptionMethods').valueChanges.subscribe((ansOptMethod) => {
      this.ansOptMethod = ansOptMethod;
    });
    this.subscriptions.push(sub);

    // 'Answer choices' field display when 'Answer list source' = 'Answer Options'
    sub = this.formProperty.findRoot().getProperty('answerOption').valueChanges
              .pipe(
                startWith(''),
                debounceTime(100),
                distinctUntilChanged()
              )
              .subscribe((ansOpts) => {
      // To trigger the validation for answer Options.
      this.formProperty.updateValueAndValidity(true);

      // filtering out the empty row
      ansOpts = ansOpts.filter((ansOpt) => 'display' in ansOpt.valueCoding);

      let changed = false;
      // The reason why ansOpt is not used is b/c it may only have one of the options
      if (!this.answerOptionDisplays || this.answerOptionDisplays.length !== ansOpts.length) {
        changed = true;
      } else {
        changed = this.answerOptionProp.some((ansOptProp, idx) => ansOptProp.valueCoding?.display !== ansOpts[idx].valueCoding?.display ||
                                                                  ansOptProp.valueCoding?.code !== ansOpts[idx].valueCoding?.code ||
                                                                  ansOptProp.valueCoding?.system !== ansOpts[idx].valueCoding?.system ||
                                                                  ansOptProp.valueCoding?.__$score !== ansOpts[idx].valueCoding?.__$score);
      }

      if (changed) {
        this.answerOptionProp = ansOpts;

        this.setAnswerOptionDisplays(this.answerOptionProp);
        this.updateLoadingStatus('Loading...');
        this.resetAutocomplete();

        if (this.formProperty?.value && this.formProperty.value.selectedAnswers.length > 0) {
          this.setPreselectedOptions(this.formProperty?.value.selectedAnswers, true);
        } else {
          this.setPreselectedOptions(this.answerOptionProp, false);
          const selectedAnswers = this.answerOptionProp.filter((answerOption) => answerOption.initialSelected);

          this.formProperty.setValue(this.createPickAnswer(selectedAnswers), false);
        }
        this.cdr.detectChanges();
        this.updateLoadingStatus('');
      }
    });
    this.subscriptions.push(sub);

    // 'Allow repeating question' field
    sub = this.formProperty.findRoot().getProperty('repeats').valueChanges.subscribe((isRepeating) => {
      const changeRequired = (isRepeating !== undefined && this.isRepeating !== isRepeating) ?? false;
      this.setAutocompleteOption(isRepeating === true);

      if (changeRequired) {
        if (this.isRepeating !== undefined) {
          this.resetAutocomplete();
          if (!this.isAnswerOptionPropEmpty()) {
            this.resetPickAnswer();
            this.resetAnswerOptionsSelections();
          }
        }

        this.isRepeating = isRepeating;
      }
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = null;
      if(errors?.length) {
        // For some reason, errors have duplicates. Remove them.
        const errorsObj = {};
        errors.reduce((acc, error) => {
          if (error.path === "#/__$pickInitial") {
            if(!acc[error.code]) {
              acc[error.code] = error;
            }
          }
          return acc;
        }, errorsObj);

        this.errors = Object.keys(errorsObj)?.length ? Object.values(errorsObj).map((e: any) => {
          const modifiedMessage = null;
          return {code: e.code, originalMessage: e.message, modifiedMessage};
        }) : null;
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Create the option object for autocomplete selection and set the 'maxSelect' flagto
   * 1 for single-select or '*' for multi-select.
   * @param isRepeat - Repeat flag indicates whether this item allows repeating.
   */
  setAutocompleteOption(isRepeat: boolean): void {
    this.opts.maxSelect = isRepeat ? '*' : 1;
  }

  /**
   * Create the 'answerOptionDisplays' to hold the display field values of the Answer Options.
   * This is used to generate the autocomplete drop-down list.
   * @param answerOptionProp - array of Answer Options.
   */
  setAnswerOptionDisplays(answerOptionProp: any ): void {
    this.answerOptionDisplays = (answerOptionProp) ?
                         answerOptionProp.filter(answer => "display" in answer.valueCoding)
                                         .map(answer => answer?.valueCoding?.display) :
                         [];
  }

  /**
   * 
   * @param selectedAnswers 
   * @param fromFormProperty 
   */
  setPreselectedOptions(selectedAnswers: any, fromFormProperty = false): void {
    if (selectedAnswers) {
      for (let i=0, len=selectedAnswers.length; i<len; ++i) {
        if ((fromFormProperty === false && selectedAnswers[i].initialSelected) || (fromFormProperty)){
          const dispVal = selectedAnswers[i].valueCoding.display || selectedAnswers[i].valueCoding.code;
          this.autoComplete.storeSelectedItem(dispVal, selectedAnswers[i].valueCoding.code);
          if(this.isRepeating) {
            this.autoComplete.addToSelectedArea(dispVal);
          } else {
            this.autoComplete.setFieldVal(dispVal);
            break;
          }
        }
      }
    }
  };

  /**
   * Destroy autocomplete.
   * Make sure to reset value
   */
  destroyAutocomplete() {
    if(this.autoComplete) {
      this.autoComplete.setFieldVal('', false);
      // autoComp.destroy() does not clear the input box for single-select
      this.autoComplete.destroy();
      this.autoComplete = null;
    }
  }

  /**
   * Reset the formProperty.value selectedAnswers to clear any data selection. 
   */
  resetPickAnswer() {
    const pickAnswer = {
      "repeats": this.isRepeating,
      "selectedAnswers": []
    };

    this.formProperty.setValue(pickAnswer, false);
  }

  /**
   * Check if answerOptionProp is empty.
   * @returns - true if empty, false otherwise.
   */
  isAnswerOptionPropEmpty(): boolean {
    if (!this.answerOptionProp || this.answerOptionProp.length === 0) {
      return true;
    }

    if (this.answerOptionProp.length === 1) {
      const option = this.answerOptionProp[0].valueCoding;
      if (!option.display && !option.code && !option.system && !option.__$score) {
        return true;
      }
    }

    return false;
  }

  /**
   * Iterates through the list of answer options and reset their selection state. If
   * any option was previously marked as selected, it will be updated to an unselected
   * state.
   */
  resetAnswerOptionsSelections() {
    if (this.answerOptionProp) {
      this.answerOptionProp.forEach((ansOpt) => delete ansOpt.initialSelected);
    }
    this.formProperty.findRoot().getProperty('answerOption').setValue(this.answerOptionProp, false);
  }

  /**
   * Create Pick Answer object to be stored in the formProperty.value
   * @param selectedAnswers - list of selection from the pick list.
   * @returns - Pick Answer object
   */
  createPickAnswer(selectedAnswers: any): any {
    return {
      "repeats": this.isRepeating,
      "selectedAnswers": selectedAnswers
    };
  }

  /**
   * Create a map of answer options with their selection state.
   * @returns - An array with index as key and boolean as value indicating selection state.
   */
  createAnswerOptionSelectionMap(): boolean[] {
    const selectionMap: boolean[] = [];
    this.answerOptionProp.forEach((option, index) => {
      selectionMap[index] = !!option.initialSelected;
    });
    return selectionMap;
  }

  /**
   * Destroy and recreate autocomplete.
   */
  resetAutocomplete() {
    this.destroyAutocomplete();

    if (this.answerOptionDisplays) {
      this.autoComplete = new Def.Autocompleter.Prefetch(
        this.autoCompleteElement.nativeElement, this.answerOptionDisplays, this.opts);
    }

    Def.Autocompleter.Event.observeListSelections(`pick-answer_${this.linkId}`, (res) => {
      // answer-option, snomed-value-set, value-set
      const ansOptMthd = this.formProperty.findRoot().getProperty('__$answerOptionMethods').value;

      if (res?.list && res?.final_val) {
        const optionIdx = res.list.indexOf(res.final_val);

        if (ansOptMthd === "answer-option") {
          let changed = false;
          if (res.removed) {
            if ('initialSelected' in this.answerOptionProp[optionIdx]) {
              delete this.answerOptionProp[optionIdx].initialSelected;
              changed = true;
            }
          } else {
            if (!('initialSelected' in this.answerOptionProp[optionIdx])) {
              if (!this.isRepeating) {
                this.answerOptionProp.forEach((answerOption) => delete answerOption.initialSelected);
              }
              this.answerOptionProp[optionIdx].initialSelected = true;
              changed = true;
            }
          }

          if (changed || this.isRepeating) {
            const selectedAnswers = this.answerOptionProp.filter((answerOption) => answerOption.initialSelected);

            // Rather than updating the "AnswerOptions" field with the selected answer
            // which caused the AnswerOptions to be refresed when nothing was changed,
            // using the answerOptionService to notify the selection state changes instead.
            if (this.isRepeating) {
              const checkboxSelection = this.createAnswerOptionSelectionMap();
              this.answerOptionService.setCheckboxSelection(checkboxSelection);
            } else {
              this.answerOptionService.setRadioSelection(optionIdx)
            }
            this.formProperty.setValue(this.createPickAnswer(selectedAnswers), false);

          }
        }
      } else if (res?.input_method === "typed" && res?.val_typed_in === "") {
        if (!this.isAnswerOptionPropEmpty()) {
          // Clear autocomplete
          this.resetPickAnswer();
          this.resetAnswerOptionsSelections();
        }
      }
    });
  }

  /**
   * Angular lifecycle hook
   */
  ngOnDestroy(): void {
    this.destroyAutocomplete();

    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

