/**
 * Customize layout of integer component from ngx-schema-form.
 */
import { AfterViewInit, Component } from '@angular/core';
import { LfbOptionControlWidgetComponent } from '../lfb-option-control-widget/lfb-option-control-widget.component';


@Component({
  standalone: false,
  selector: 'lfb-integer-widget',
  template: `
    @if (schema.widget.id ==='hidden') {
      <input
        name="{{name}}" type="hidden" [formControl]="control">
    } @else {
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        @if (!nolabel) {
          <lfb-label
            [for]="id"
            [title]="schema.title"
            [helpMessage]="schema.description"
            [ngClass]="labelWidthClass + ' ps-0 pe-1'"
          ></lfb-label>
        }

        @if (hasAnswerOptions$ | async) {
          <div class="{{controlWidthClass}} p-0">
            <input lfbInteger autocomplete="off" #enableWhenAnswerOptions type="number" [attr.id]="id" class="form-control"
                   (input)="onInput($event)" (blur)="suppressInvalidValue($event)" [value]="control?.value ?? ''"/>
          </div>
        } @else {
          <input lfbInteger [attr.readonly]="schema.readOnly?true:null" name="{{name}}"
                 [attr.id]="id"
                 class="form-control {{controlWidthClass}}" [formControl]="control"
                 type="number" [attr.min]="schema.minimum" [attr.max]="schema.maximum"
                 [attr.placeholder]="schema.placeholder"
                 [attr.maxLength]="schema.maxLength || null"
                 [attr.minLength]="schema.minLength || null">
        }

        @if (errors?.length && formProperty.value) {
          @for (error of errors; track error.code) {
            <small class="text-danger form-text" role="alert"
            >{{error.modifiedMessage || error.originalMessage}}</small>
          }
        }
      </div>
    }
    `,
  styles: []
})
export class IntegerComponent extends LfbOptionControlWidgetComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.control.setValue(this.formProperty.value);
  }
}
