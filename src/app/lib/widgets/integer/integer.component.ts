/**
 * Customize layout of integer component from ngx-schema-form.
 */
import { AfterViewInit, Component } from '@angular/core';
import { LfbOptionControlWidgetComponent } from '../lfb-option-control-widget/lfb-option-control-widget.component';


@Component({
  standalone: false,
  selector: 'lfb-integer-widget',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           name="{{name}}" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        <lfb-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass + ' ps-0 pe-1'"
        ></lfb-label>
        <ng-container *ngIf="hasAnswerOptions$ | async; else typeInput">
          <div class="{{controlWidthClass}} p-0">
            <input lfbInteger autocomplete="off" #enableWhenAnswerOptions type="number" [attr.id]="id" class="form-control"
                   (input)="onInput($event)" (blur)="suppressInvalidValue($event)" [value]="control?.value ?? ''"/>
          </div>
        </ng-container>

        <ng-template #typeInput>
          <input lfbInteger [attr.readonly]="schema.readOnly?true:null" name="{{name}}"
            [attr.id]="id"
            class="form-control {{controlWidthClass}}" [formControl]="control"
            type="number" [attr.min]="schema.minimum" [attr.max]="schema.maximum"
            [attr.placeholder]="schema.placeholder"
            [attr.maxLength]="schema.maxLength || null"
            [attr.minLength]="schema.minLength || null">
        </ng-template>
        <ng-container *ngFor="let error of errors">
          <small *ngIf="formProperty.value && error"
                class="text-danger form-text" role="alert"
          >{{error.modifiedMessage || error.originalMessage}}</small>
        </ng-container>
      </div>
    </ng-template>
  `,
  styles: []
})
export class IntegerComponent extends LfbOptionControlWidgetComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.control.setValue(this.formProperty.value);
  }
}
