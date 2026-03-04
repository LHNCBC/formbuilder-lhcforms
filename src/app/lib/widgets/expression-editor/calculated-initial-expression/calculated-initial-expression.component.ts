import {ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
  EXTENSION_URL_CALCULATED_EXPRESSION, EXTENSION_URL_INITIAL_EXPRESSION,
  VALUE_METHOD_COMPUTE_CONTINUOUSLY,
  VALUE_METHOD_COMPUTE_INITIAL
} from "../../../constants/constants";
import {CommonModule} from "@angular/common";
import {LabelComponent} from "../../label/label.component";
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedObjectService} from "../../../../services/shared-object.service";
import {ExtensionsService} from "../../../../services/extensions.service";
import {ExpressionEditorComponent} from "../expression-editor.component";

@Component({
  selector: 'lfb-calculated-initial-expression',
  imports: [CommonModule, LabelComponent, FormsModule, FontAwesomeModule],
  templateUrl: '../expression-editor.component.html',
  styleUrl: '../answer-expression.component.css',
})
export class CalculatedInitialExpressionComponent extends ExpressionEditorComponent implements OnInit {

  ngOnInit() {
    super.ngOnInit();
    const sub = this.formProperty.searchProperty('__$valueMethod').valueChanges.subscribe((value) => {
      if(value !== VALUE_METHOD_COMPUTE_INITIAL && value !== VALUE_METHOD_COMPUTE_CONTINUOUSLY) {
        this.extensionsService.removeAllExtensions((f) => {
          return f?.value?.url === EXTENSION_URL_INITIAL_EXPRESSION || f?.value?.url === EXTENSION_URL_CALCULATED_EXPRESSION;
        });
      }
      else {
        const currentUrl = this.extension?.url;
        this.extension.url = this.getUrlByValueMethod(value);
        if(this.expression) {
          this.extensionsService.replaceExtensions(currentUrl, [this.extension]);
        }
        else {
          this.extensionsService.removeAllExtensions((f) => {
            return f?.value?.url === EXTENSION_URL_INITIAL_EXPRESSION || f?.value?.url === EXTENSION_URL_CALCULATED_EXPRESSION;
          });
        }
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Return the expression url based on the value method.
   * @param valueMethod - "compute-initial", "compute-continuously" or "answer-expression".
   * @returns - expression url.
   */
  getUrlByValueMethod(valueMethod: string): string {
    let ret = null;
    if (valueMethod === VALUE_METHOD_COMPUTE_INITIAL) {
      ret = EXTENSION_URL_INITIAL_EXPRESSION;
    } else if (valueMethod === VALUE_METHOD_COMPUTE_CONTINUOUSLY) {
      ret = EXTENSION_URL_CALCULATED_EXPRESSION;
    }
    return ret;
  }

}
