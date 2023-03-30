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

@Component({
  selector: 'lfb-enable-operator',
  template: `
    <select #mySelect
            [(ngModel)]="myModel"
            (ngModelChange)="onModelChange($event)"
            name="{{name}}" [attr.id]="id"
            [disabled]="schema.readOnly" class="form-control">
      <ng-container>
        <option *ngFor="let opt of options[answerType]" [ngValue]="opt.option" >{{opt.label}}</option>
      </ng-container>
    </select>
  `,
  styles: [
  ]
})
export class EnableOperatorComponent extends LfbControlWidgetComponent implements OnInit {

  // All operators
  userOptions: any [] = [
    {option: 'exists', label: 'Not empty'},
    {option: 'notexists', label: 'Empty'},
    {option: '=', label: '='},
    {option: '!=', label: '!='},
    {option: '>', label: '>'},
    {option: '<', label: '<'},
    {option: '>=', label: '>='},
    {option: '<=', label: '<='}
  ];

  // A subset of operators for certain types
  userOptions2: any [] = this.userOptions.filter((e) => {
    return (
      e.option === 'exists' ||
      e.option === 'notexists' ||
      e.option === '=' ||
      e.option === '!='
    );
  });

  // Operators based on type.
  options = {
    decimal: this.userOptions,
    integer: this.userOptions,
    quantity: this.userOptions,
    date: this.userOptions,
    dateTime: this.userOptions,
    time: this.userOptions,
    string: this.userOptions,
    text: this.userOptions,
    url: this.userOptions2,
    boolean: this.userOptions2,
    choice: this.userOptions2,
    'open-choice': this.userOptions2,
    attachment: this.userOptions2,
    reference: this.userOptions2
  };

  myModel: string;
  answerType: string;
  selectOptionList: any [];

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
        this.selectOptionList = this.options[this.answerType];
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
