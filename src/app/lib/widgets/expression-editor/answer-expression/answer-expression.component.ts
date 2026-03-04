import { Component, OnInit, AfterViewInit } from '@angular/core';
import {Subscription} from 'rxjs';
import {
  EXTENSION_URL_ANSWER_EXPRESSION,
  ANSWER_OPTION_METHOD_ANSWER_EXPRESSION
} from '../../../constants/constants';
import {ExpressionEditorComponent} from "../expression-editor.component";

@Component({
  standalone: false,
  selector: 'lfb-expression-editor',
  templateUrl: '../expression-editor.component.html',
  styleUrl: '../answer-expression.component.css'
})
export class AnswerExpressionComponent extends ExpressionEditorComponent implements OnInit, AfterViewInit {

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    super.ngOnInit();
    let sub: Subscription;
    sub = this.formProperty.searchProperty('__$answerOptionMethods').valueChanges.subscribe((value) => {
      if(value === ANSWER_OPTION_METHOD_ANSWER_EXPRESSION ) {
        this.extensionsService.updateExtension(this.extension);
      }
      else {
        this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_ANSWER_EXPRESSION);
      }
    });
    this.subscriptions.push(sub);
  };

}

