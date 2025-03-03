import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import {FormService} from '../../../services/form.service';
import { Subscription } from 'rxjs';
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";

@Component({
  selector: 'lfb-value-method',
  templateUrl: './value-method.component.html'
})
export class ValueMethodComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  type;
  linkId: string;
  answerOptions;
  subscriptions: Subscription[] = [];

  displayTypeInitial = true;
  displayPickInitial = true;

  currentValueMethod: string;

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

  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub: Subscription;

    sub = this.formProperty.searchProperty('type').valueChanges.subscribe((typeVal) => {
      this.type = typeVal;
      this.displayTypeInitial = (typeVal !== 'group' && typeVal !== 'display' && typeVal !== 'choice' && typeVal !== 'open-choice');
      this.displayPickInitial = (typeVal === 'choice' || typeVal === 'open-choice');
      
      const initial = this.formProperty.findRoot().getProperty('initial').value;
      const answerOptions = this.formProperty.findRoot().getProperty('answerOption').value;
      const answerOptionMethod = this.formProperty.searchProperty('__$answerOptionMethods').value;

      let hasPickSelection = false;
      if (this.displayPickInitial) {
        hasPickSelection = answerOptions.some(opt => "initialSelected" in opt);
      }

      let hasAnswerValuetSetURL = false;
      const valueSetUrl = this.formProperty.searchProperty('answerValueSet').value;
      if(valueSetUrl?.length > 0) {
        hasAnswerValuetSetURL = true;
      }

      // Determine which Value Method option to select based on the available data. 
      // Default to 'None' if didn't meet the conditions.
      if (this.displayTypeInitial && initial?.length > 0) {
          this.control.setValue("type-initial", { emitEvent: true });
          this.formProperty.setValue("type-initial", false);
      } else if ((this.displayPickInitial && answerOptionMethod === 'answer-option' && answerOptions?.length > 0 && hasPickSelection) ||
                 (this.displayPickInitial && (answerOptionMethod === 'snomed-value-set' || answerOptionMethod === 'value-set') && hasAnswerValuetSetURL)
                )
      {
        this.control.setValue("pick-initial", { emitEvent: true });
        this.formProperty.setValue("pick-initial", false);
      } else {
        const formPropertyExtensions = this.formProperty.findRoot().getProperty('extension').value;
        const expression = formPropertyExtensions.filter(ext => ext.url === FormService.INITIAL_EXPRESSION || ext.url === FormService.CALCULATED_EXPRESSION);

        if (expression[0]?.url === FormService.INITIAL_EXPRESSION) {
          this.control.setValue("compute-initial", { emitEvent: true });
          this.formProperty.setValue("compute-initial", false);          
        } else if (expression[0]?.url === FormService.CALCULATED_EXPRESSION) {
          this.control.setValue("compute-continuously", { emitEvent: true });
          this.formProperty.setValue("compute-continuously", false);
        } else {
          this.control.setValue("none", { emitEvent: true });
          this.formProperty.setValue("none", false);  
        }
      }
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
