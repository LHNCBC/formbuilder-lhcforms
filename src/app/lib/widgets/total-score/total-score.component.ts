/**
 * Handles total score input on the item level form
 */
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ExtensionsComponent} from '../extensions/extensions.component';
import {fhir} from '../../../fhir';
import {ArrayProperty, FormProperty} from 'ngx-schema-form';
import { RuleEditorService } from 'rule-editor';
import {SharedObjectService} from '../../../services/shared-object.service';
import {Subscription} from 'rxjs';


@Component({
  selector: 'lfb-total-score',
  template: `
    <div [ngClass]="{'row': labelPosition === 'left', 'm-0' : true, 'widget': true}">
      <lfb-label [title]="schema.title" [helpMessage]="schema.description" [ngClass]="labelWidthClass + ' pl-0 pr-1'"></lfb-label>

      <div ngbRadioGroup
           [attr.name]="name"
           class="btn-group form-check-inline btn-group-sm btn-group-toggle" [ngModel]="selected" (ngModelChange)="onChange($event)">
        <ng-container *ngFor="let option of ['No', 'Yes']" class="radio">
          <label ngbButtonLabel class="btn-outline-success m-0">
            <input ngbButton [value]="option === 'Yes'" type="radio" [attr.disabled]="schema.readOnly ? '' : null">
            {{option}}
          </label>
        </ng-container>
      </div>
    </div>
  `,
  styles: [
  ]
})
export class TotalScoreComponent extends ExtensionsComponent implements OnInit, OnDestroy {

  public static CALCULATED_EXPRESSION = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression';

  selected = false;
  questionnaire: fhir.Questionnaire;
  item: fhir.QuestionnaireItem;

  subscriptions: Subscription [] = [];

  constructor(private ruleEditorService: RuleEditorService, private modelService: SharedObjectService) {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    const eligibleIndicator: FormProperty = this.formProperty.searchProperty('__$totalScoreItem');
    // TODO - Use rule-editor service to determine eligibility.
    const eligible = 'true';
    eligibleIndicator.setValue(eligible, true);
    let subscrption = eligibleIndicator.valueChanges.subscribe((value) => {
      if(value) {
        this.selected = this.isTotalScoreAssigned(this.extensionsProp.properties as FormProperty[]);
      }
    });
    this.subscriptions.push(subscrption);
    // Listen to changes in questionnaire and item.
    subscrption = this.modelService.currentItem$.subscribe((item) => {
      this.item = item;
    });
    this.subscriptions.push(subscrption);
    subscrption = this.modelService.questionnaire$.subscribe((q) => {
      this.questionnaire = q;
    });
    this.subscriptions.push(subscrption);

  }

  /**
   * Handle user interactions with this widget.
   *
   * @param selected - boolean from radio box.
   */
  onChange(selected) {
    if(selected) {
      this.ruleEditorService.addTotalScoreRule(this.questionnaire, this.item.linkId);
    }
    else {
      this.removeTotalScore();
    }
  }

  /**
   * TODO - Use rule-editor service to find if total score extension is present.
   * Check if extensions have total score included.
   * @param extensions - FHIR extension array to search for total score extension.
   * @return boolean
   */
  isTotalScoreAssigned(props: FormProperty []): boolean {
    if(!props || props.length === 0) {
      return false;
    }

    return props.some((p) => {
      return p.value.url === TotalScoreComponent.CALCULATED_EXPRESSION &&
        p.value.valueExpression.description.toLowerCase() === 'total score calculation';
    });
  }


  /**
   * Remove any existing total score extension.
   */
  removeTotalScore(): void {
    const props = this.extensionsProp.properties as FormProperty[];
    if(props && props.length > 0) {
      const i = props.findIndex((p) => {
        return p.value.url === TotalScoreComponent.CALCULATED_EXPRESSION && p.value.valueExpression.description.toLowerCase() === 'total score calculation';
      })
      if(i >= 0) {
        props.splice(i, 1);
      }
    }
  }


  ngOnDestroy() {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
