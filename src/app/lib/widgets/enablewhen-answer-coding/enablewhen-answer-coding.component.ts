/**
 * Answer coding component for enableWhen. The component is used for answer type coding for
 * selecting codes to satisfy a condition.
 */
import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {ObjectWidget} from '@lhncbc/ngx-schema-form';
import {FormService} from '../../../services/form.service';
import fhir from 'fhir/r4';
import {Subscription} from 'rxjs';
import {AutoCompleteOptions} from '../auto-complete/auto-complete.component';
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
      <select [ngModel]="model" [compareWith]="compareFn" (ngModelChange)="modelChanged($event)"
              name="{{name}}" [attr.id]="id"
              class="form-control"
      >
        <ng-container>
          <option *ngFor="let option of answerOptions" [ngValue]="option.valueCoding"
          >{{option.valueCoding.display}} ({{option.valueCoding.code}})</option>
        </ng-container>
      </select>
    </ng-template>
  `,
  styles: [
  ]
})
export class EnablewhenAnswerCodingComponent extends ObjectWidget implements OnInit, AfterViewInit, OnDestroy {

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

  /**
   * Invoke super constructor.
   *
   * @param formService - Inject form service
   */
  constructor(private formService: FormService) {
    super();
  }

  ngOnInit() {
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
