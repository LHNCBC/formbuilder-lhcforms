import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {AnswerOptionComponent} from '../answer-option/answer-option.component';
import {StringComponent} from '../string/string.component';
import {LabelRadioComponent} from '../label-radio/label-radio.component';
import {AnswerValueSetComponent} from '../answer-value-set/answer-value-set.component';
import {FormService} from '../../../services/form.service';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {Subscription} from 'rxjs';

@Component({
  standalone: false,
  selector: 'lfb-answer-option-methods',
  templateUrl: './answer-option-methods.component.html'
})
export class AnswerOptionMethodsComponent extends LabelRadioComponent implements OnInit, AfterViewInit {

  subscriptions: Subscription [] = [];
  @ViewChild('answerOption', {static: true, read: AnswerOptionComponent}) answerOption: AnswerOptionComponent;
  @ViewChild('answerValueSet', {static: true, read: StringComponent}) answerValueSet: StringComponent;
  isSnomedUser = false;

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
  }

  /**
   * Change handler.
   */
  handleChange() {
    let message = '';
    switch(this.formProperty.value) {
      case 'answer-option':
        message = `Fields for answer options are displayed below.`;
        break;
      case 'snomed-value-set':
        message = `Fields for a SNOMED CT answer value set are displayed below.`;
        break;
      case 'value-set':
        message = `A field for an answer value set URI is displayed below.`;
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
    }
  }
}
