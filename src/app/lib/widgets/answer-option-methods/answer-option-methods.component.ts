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
  type = 'string';
  isAnswerList = false;
  extensionsService: ExtensionsService = inject(ExtensionsService);
  tableService = inject(TableService);

  constructor(private formService: FormService, private liveAnnouncer: LiveAnnouncer) {
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

  ngAfterViewInit() {
    super.ngAfterViewInit();

    let sub: Subscription;

    sub = this.formProperty.valueChanges.subscribe((ansOptMethod) => {
      if (ansOptMethod === "answer-expression") {
        const warningMessage = 'Validation and automatic lookup for Answer Expression are not available. The expression cannot be checked, and initial values must be entered manually.';

        const status: TableStatus = {
          type: 'warning',
          message: warningMessage
        };
        this.tableService.setTableStatusChanged(status);
        
      } else {
        // Clear previous status to force UI update
        this.tableService.setTableStatusChanged(null);
        
      }
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
      case 'answer-option':
        message = `Fields for answer options are displayed below.`;
        break;
      case 'snomed-value-set':
        message = `Fields for a SNOMED CT answer value set are displayed below.`;
        break;
      case 'value-set':
        message = `A field for an answer value set URI is displayed below.`;
        break;
      case 'answer-expression':
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
      let valueSetType = 'value-set';
      if(this.isSnomedUser &&
        (valueSetUrl.startsWith(AnswerValueSetComponent.snomedBaseUri))) {
        valueSetType = 'snomed-value-set';
      }
      this.formProperty.setValue(valueSetType, false);
    } else {
      const answerExpressionExtension = this.extensionsService.getFirstExtensionByUrl(ExtensionsService.ANSWER_EXPRESSION);
      if (answerExpressionExtension) {
        this.formProperty.setValue('answer-expression', false);
      }
    }
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
