import {Component, OnInit, ViewChild} from '@angular/core';
import {AnswerOptionComponent} from '../answer-option/answer-option.component';
import {StringComponent} from '../string/string.component';
import {LabelRadioComponent} from '../label-radio/label-radio.component';
import {AnswerValueSetComponent} from '../answer-value-set/answer-value-set.component';
import {FormService} from '../../../services/form.service';

@Component({
  selector: 'lfb-answer-option-methods',
  templateUrl: './answer-option-methods.component.html'
})
export class AnswerOptionMethodsComponent extends LabelRadioComponent implements OnInit {

  @ViewChild('answerOption', {static: true, read: AnswerOptionComponent}) answerOption: AnswerOptionComponent;
  @ViewChild('answerValueSet', {static: true, read: StringComponent}) answerValueSet: StringComponent;
  isSnomedUser = false;

  constructor(private formService: FormService) {
    super();
  }

  /**
   * Initialize
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.isSnomedUser = this.formService.isSnomedUser();
    const valueSetUrl = this.formProperty.searchProperty('answerValueSet').value;
    if(valueSetUrl?.length > 0) {
      let valueSetType = 'value-set';
      if(this.isSnomedUser && valueSetUrl.startsWith(AnswerValueSetComponent.snomedBaseUrl)) {
        valueSetType = 'snomed-value-set';
      }
      this.formProperty.setValue(valueSetType, false);
    }
  }
}
