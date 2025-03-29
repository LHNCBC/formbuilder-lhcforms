/**
 * This component handles peculiar case of operator.
 *
 * The semantics of exists and not-exists are implied by 'exists' value in operator (this.formProperty)
 * and followed by true/false value in answerBoolean.
 *
 * The template here is not directly bound to control's form property.
 * It is updated programmatically in the class.
 */

import {Component, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { FormService } from 'src/app/services/form.service';

@Component({
  standalone: false,
  selector: 'lfb-enable-operator',
  template: `
    <select #mySelect
            [(ngModel)]="myModel"
            (ngModelChange)="onModelChange($event)"
            name="{{name}}" [attr.id]="id"
            [disabled]="schema.readOnly" class="form-control">
      <ng-container>
        <option *ngFor="let opt of selectOptionList" [ngValue]="opt.option" >{{opt.label}}</option>
      </ng-container>
    </select>
  `,
  styles: [
  ]
})
export class EnableOperatorComponent extends LfbControlWidgetComponent implements OnInit {

  myModel: string;
  answerType: string;
  selectOptionList: any [];

  constructor(private formService: FormService) {
    super();
  };

  /**
   * Initialize
   */
  ngOnInit(): void {
    // this.formProperty represents operator from schema.
    const answerBool = this.formProperty.searchProperty('answerBoolean');

    this.formProperty.valueChanges.subscribe((val) => {
      if (val === 'exists' && answerBool.value === false) {
        this.myModel = 'notexists';
      } else {
        this.myModel = val;
      }
    });

    this.formProperty.searchProperty('__$answerType').valueChanges.subscribe((val) => {
      this.answerType = val;
      if(this.answerType) {
        this.selectOptionList = this.formService.getEnableWhenOperatorListByAnswerType(this.answerType);
        this.myModel = !this.myModel ? this.selectOptionList[0].option : this.myModel;
        setTimeout(() => {
          this.onModelChange(this.myModel);
        });
      }
      else {
        this.selectOptionList = [];
      }
    });
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
