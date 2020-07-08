import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {SelectComponent} from './select.component';

/**
 * This component Handles peculiar case of operator.
 *
 * The semantics of exists and not-exists are implied by 'exists' value in operator (this.formProperty)
 * and followed by true/false value in answerBoolean.
 *
 * The template here is not directly bound to control's form property.
 * It is updated programatically in the class.
 */

@Component({
  selector: 'app-coding-operator',
  template: `
    <select #mySelect
            [(ngModel)]="model"
            (change)="onSelected()"
            [attr.name]="name" [attr.id]="id"
            [disabled]="schema.readOnly" [disableControl]="schema.readOnly" class="form-control">
      <ng-container>
        <option *ngFor="let option of options[answerType]" [ngValue]="option.option" >{{option.label}}</option>
      </ng-container>
    </select>
  `,
  styles: [
  ]
})
export class CodingOperatorComponent extends SelectComponent implements OnInit {

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

  userOptions2: any [] = this.userOptions.filter((e) => {
    return (
      e.option === 'exists' ||
      e.option === 'notexists' ||
      e.option === '=' ||
      e.option === '!='
    );
  });

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

    this.formProperty.searchProperty('_answerType').valueChanges.subscribe((val) => {
      this.answerType = val;
    });
  }

  onSelected(): void {
    if (this.model === 'exists') {
      this.formProperty.searchProperty('answerBoolean').setValue(true, true);
      this.formProperty.setValue(this.model, true);
    } else if (this.model === 'notexists') {
      this.formProperty.searchProperty('answerBoolean').setValue(false, true);
      this.formProperty.setValue('exists', true);
    } else {
      this.formProperty.searchProperty('answerBoolean').reset(null, true);
      this.formProperty.setValue(this.model, true);
    }
  }
}
