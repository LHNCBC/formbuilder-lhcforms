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
declare var LForms: any;

@Component({
  selector: 'lfb-enablewhen-answer-coding',
  imports: [AutoCompleteComponent, FormsModule],
  template: `
    <div class="widget form-group form-group-sm m-0 p-0">
      @if (autoComplete) {
        <lfb-auto-complete [options]="acOptions" [model]="model" (selected)="modelChanged($event)" (removed)="modelChanged(null)"></lfb-auto-complete>
      } @else {
        <select [ngModel]="model" [compareWith]="compareFn" (ngModelChange)="modelChanged($event)"
          name="{{name}}" [attr.id]="id"
          class="form-control"
          >
          <ng-container>
            <!-- Create some unique track argument -->
            @for (option of answerOptions; track (option.valueCoding.display + ' ' + option.valueCoding.code)) {
              <option [ngValue]="option.valueCoding"
              >{{option.valueCoding.display}} ({{option.valueCoding.code}})</option>
            }
          </ng-container>
        </select>
      }
    </div>

    `,
  styles: [
  ]
})
export class EnablewhenAnswerCodingComponent extends ObjectWidget implements OnInit, AfterViewInit, OnDestroy {
  private formService = inject(FormService);
  private modelService = inject(SharedObjectService);


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

  ngOnInit() {
    this.init();
  }


  /**
   * Component initialization.
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
  }


  /**
   * Initialize the auto-complete widget
   */
  init() {
    const sourceLinkId = this.formProperty.searchProperty('question').value;
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
   * @param sourceItem - Source item
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
}
