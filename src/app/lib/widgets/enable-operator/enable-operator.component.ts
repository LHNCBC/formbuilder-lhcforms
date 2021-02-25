/**
 * This component handles peculiar case of operator.
 *
 * The semantics of exists and not-exists are implied by 'exists' value in operator (this.formProperty)
 * and followed by true/false value in answerBoolean.
 *
 * The template here is not directly bound to control's form property.
 * It is updated programmatically in the class.
 */

import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {SelectComponent} from '../select/select.component';

@Component({
  selector: 'lfb-enable-operator',
  template: `
    <select #mySelect
            [(ngModel)]="model"
            (change)="onSelected()"
            [attr.name]="name" [attr.id]="id"
            [attr.disabled]="schema.readOnly ? '' : null" class="form-control">
      <ng-container>
        <option *ngFor="let option of options[answerType]" [ngValue]="option.option" >{{option.label}}</option>
      </ng-container>
    </select>
  `,
  styles: [
  ]
})
export class EnableOperatorComponent extends SelectComponent implements OnInit {

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

  model: string;
  answerType: string;

  /**
   * Initialize
   */
  ngOnInit(): void {
    // this.formProperty represents operator from schema.
    const answerBool = this.formProperty.searchProperty('answerBoolean');
    answerBool.valueChanges.subscribe((val) => {
      if (val === true || val === false) {
        if (this.model === 'exists' || this.model === 'notexists') {
          this.formProperty.setValue('exists', true);
        }
      }
    });

    this.formProperty.valueChanges.subscribe((val) => {
      if (val === 'exists' && answerBool.value === false) {
        this.model = 'notexists';
      } else {
        this.model = val;
      }
    });

    this.formProperty.searchProperty('__$answerType').valueChanges.subscribe((val) => {
      this.answerType = val;
    });
  }

  /**
   * Update control property and its dependent answerBoolean based on user interaction with this widget.
   */
  onSelected(): void {
    if (this.model === 'exists') {
      // answerBoolean should be set to true.
      this.formProperty.searchProperty('answerBoolean').setValue(true, true);
      this.formProperty.setValue(this.model, true);
    } else if (this.model === 'notexists') {
      // There is no notexists. It is 'exists' with answerBoolean set to false
      this.formProperty.searchProperty('answerBoolean').setValue(false, true);
      this.formProperty.setValue('exists', true);
    } else {
      // All others cases
      this.formProperty.searchProperty('answerBoolean').reset(null, true);
      this.formProperty.setValue(this.model, true);
    }
  }
}
