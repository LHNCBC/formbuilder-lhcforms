import { Component, Input, OnInit, AfterViewInit, Output, EventEmitter, ChangeDetectorRef, inject } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import {
  CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION,
  EXTENSION_URL_ENABLEWHEN_EXPRESSION,
} from '../../../constants/constants';
import {CommonModule} from "@angular/common";
import {LabelComponent} from "../../label/label.component";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {ExpressionEditorComponent} from "../expression-editor.component";

@Component({
  selector: 'lfb-enable-when-expression',
  templateUrl: '../expression-editor.component.html',
  styleUrl: '../answer-expression.component.css',
  imports: [CommonModule, LabelComponent, FormsModule, FontAwesomeModule]
})
export class EnableWhenExpressionComponent extends ExpressionEditorComponent implements OnInit, AfterViewInit {

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    super.ngOnInit();
    let sub: Subscription;
    sub = this.formProperty.searchProperty('__$enableWhenMethod').valueChanges.subscribe((value) => {
      if(value === CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION) {
        this.extensionsService.updateExtension(this.extension);
      }
      else {
        this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_ENABLEWHEN_EXPRESSION);
      }
    });
    this.subscriptions.push(sub);
  };
}

