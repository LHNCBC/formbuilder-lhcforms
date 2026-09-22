/**
 * This component handles peculiar case of operator.
 *
 * The semantics of exists and not-exists are implied by 'exists' value in operator (this.formProperty)
 * and followed by true/false value in answerBoolean.
 *
 * The template here is not directly bound to control's form property.
 * It is updated programmatically in the class.
 */

import {Component, inject, AfterViewInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { FormService } from 'src/app/services/form.service';
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'lfb-enable-operator',
  imports: [FormsModule],
  template: `
    <select #mySelect
      [(ngModel)]="myModel"
      (ngModelChange)="onModelChange($event)"
      name="{{name}}" [attr.id]="id"
      [disabled]="schema.readOnly" class="form-control form-control-sm">
      <ng-container>
        @for (opt of selectOptionList; track opt.option) {
          <option [ngValue]="opt.option" >{{opt.label}}</option>
        }
      </ng-container>
    </select>
    `,
  styles: [
  ]
})
export class EnableOperatorComponent extends LfbControlWidgetComponent implements AfterViewInit {
  private formService = inject(FormService);


  myModel: string;
  answerType: string;
  selectOptionList: any [];

  /**
   * Initialize
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.subscriptions.push(this.formProperty.valueChanges.subscribe((val) => {
      // this.formProperty represents operator from schema.
      const answerBool = this.formProperty.searchProperty('answerBoolean');
      if (val === 'exists' && answerBool.value === false) {
        this.myModel = 'notexists';
      } else {
        this.myModel = val;
      }
    }));

    const answerTypeProperty = this.formProperty.searchProperty('__$answerType');
    const answerBoolean = this.formProperty.searchProperty('answerBoolean')?.value;
    this.myModel = this.formProperty.value === 'exists' && answerBoolean === false
      ? 'notexists'
      : this.formProperty.value;
    this.answerType = answerTypeProperty?.value;
    this.refreshOptionList(false);
    this.syncOperator();

    this.subscriptions.push(answerTypeProperty.valueChanges.subscribe((val) => {
      this.answerType = val;
      this.refreshOptionList(this.answerType === 'attachment');
      this.syncOperator();
    }));
  }

  /**
   * Refresh the operators allowed for the current answer type.
   * @param coerceInvalid - Whether to replace an unsupported current operator.
   */
  private refreshOptionList(coerceInvalid: boolean): void {
    if(!this.answerType) {
      this.selectOptionList = [];
      return;
    }

    this.selectOptionList = this.formService.getEnableWhenOperatorListByAnswerType(this.answerType);

    if(!this.selectOptionList?.length) {
      return;
    }

    const currentOption = this.selectOptionList.some((option) => option.option === this.myModel);
    if(!this.myModel) {
      this.myModel = this.selectOptionList[0].option;
    }
    else if(coerceInvalid && !currentOption) {
      this.myModel = this.selectOptionList[0].option;
    }
  }

  /** Commit the currently selected operator after the form controls settle. */
  private syncOperator(): void {
    if(this.myModel) {
      setTimeout(() => this.onModelChange(this.myModel));
    }
  }


  /**
   * Update control property and its dependent answerBoolean based on user interaction with this widget.
   */
  onModelChange(value): void {
    const controlVal = value === 'notexists' ? 'exists' : value;
    const bool = value === 'exists';
    if(controlVal === 'exists') {
      this.formProperty.searchProperty('answerBoolean').setValue(bool, true);
    }
    this.control.setValue(controlVal);
  }
}
