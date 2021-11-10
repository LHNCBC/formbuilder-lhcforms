/**
 * Answer coding component for enableWhen. The component is used for answer type choice for
 * selecting codes to satisfy a condition.
 */
import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ObjectWidget} from '@lhncbc/ngx-schema-form';
import {FormService} from '../../../services/form.service';

@Component({
  selector: 'lfb-enablewhen-answer-coding',
  template: `
    <div class="widget form-group form-group-sm">
      <select [formControl]="control"
              [attr.name]="name" [attr.id]="id"
              class="form-control"
              (change)="onChange($event)"
      >
        <ng-container>
          <option *ngFor="let option of answerOption" [ngValue]="option.valueCoding"
          >{{option.valueCoding.display}} ({{option.valueCoding.code}})</option>
        </ng-container>
      </select>
    </div>
  `,
  styles: [
  ]
})
export class EnablewhenAnswerCodingComponent extends ObjectWidget implements AfterViewInit {

  answerOption: any[] = [];

  /**
   * Invoke super constructor.
   *
   * @param formService
   */
  constructor(private formService: FormService) {
    super();
  }

  /**
   * Component initialization.
   */
  ngAfterViewInit(): void {
    // Setup two binding between property value and control value.
    this.control.valueChanges.subscribe((value) => {
      this.formProperty.setValue(value, false);
    });

    this.formProperty.valueChanges.subscribe((newValue) => {
      const currentValue = this.control.value;
      if (currentValue.display !== newValue.display || currentValue.code !== newValue.code) {
        this.control.setValue(newValue, {emitEvent: false});
      }
    });

    // Listen to question value changes.
    this.formProperty.searchProperty('question').valueChanges.subscribe((source) => {
      this.answerOption = [];
      if (!source || !source.data) {
        return;
      }
      const answerType = this.formProperty.searchProperty('__$answerType').value;

      if (answerType === 'choice' || answerType === 'open-choice') {
        const sourceNode = this.formService.getTreeNodeByLinkId(source.data.linkId);
        this.answerOption =
          (sourceNode && sourceNode.data && sourceNode.data.answerOption)
            ? sourceNode.data.answerOption : [];
      }
    });
  }


  /**
   *
   * @param event
   */
  onChange(event): void {
    console.log('answer code selected: ' + event);
  }
}
