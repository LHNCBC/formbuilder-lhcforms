import {Component, OnInit, ViewChild} from '@angular/core';
import { FormProperty } from '@lhncbc/ngx-schema-form';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {AnswerOptionComponent} from '../answer-option/answer-option.component';
import {StringComponent} from '../string/string.component';
import {LabelRadioComponent} from '../label-radio/label-radio.component';

@Component({
  selector: 'lfb-answer-option-methods',
  templateUrl: './../label-radio/label-radio.component.html'
})
export class AnswerOptionMethodsComponent extends LabelRadioComponent implements OnInit {

  @ViewChild('answerOption', {static: true, read: AnswerOptionComponent}) answerOption: AnswerOptionComponent;
  @ViewChild('answerValueSet', {static: true, read: StringComponent}) answerValueSet: StringComponent;
  isValueSet = false;
  answerOptionProperty: FormProperty;
  answerValueSetProperty: FormProperty;

  ngOnInit(): void {
    const valueSetUrl = this.formProperty.searchProperty('answerValueSet').value;
    if(valueSetUrl?.length > 0) {
      this.formProperty.setValue('value-set', false);
    }
  }
}
