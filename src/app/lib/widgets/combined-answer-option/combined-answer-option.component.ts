import {Component, OnInit, ViewChild} from '@angular/core';
import { FormProperty } from '@lhncbc/ngx-schema-form';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {AnswerOptionComponent} from '../answer-option/answer-option.component';
import {StringComponent} from '../string/string.component';

@Component({
  selector: 'lfb-combined-answer-option',
  templateUrl: './combined-answer-option.component.html',
  styleUrls: ['./combined-answer-option.component.css']
})
export class CombinedAnswerOptionComponent extends LfbControlWidgetComponent implements OnInit {

  @ViewChild('answerOption', {static: true, read: AnswerOptionComponent}) answerOption: AnswerOptionComponent;
  @ViewChild('answerValueSet', {static: true, read: StringComponent}) answerValueSet: StringComponent;
  isValueSet = false;
  answerOptionProperty: FormProperty;
  answerValueSetProperty: FormProperty;
  constructor() {
    super();
  }

  ngOnInit(): void {

    this.answerOptionProperty = this.formProperty.searchProperty('/answerOption');
    this.answerValueSetProperty = this.formProperty.searchProperty('/answerValueSet');
  }

  setIsValueSet(isValueSet: boolean) {
   // this.answerValueSetProperty.setVisible(isValueSet);
   // this.answerValueSetProperty.setVisible(!isValueSet);
  }
}
