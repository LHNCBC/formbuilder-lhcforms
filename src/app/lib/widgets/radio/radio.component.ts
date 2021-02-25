/**
 * Customize the radio widget template.
 */
import { Component } from '@angular/core';

import { ControlWidget } from 'ngx-schema-form';

@Component({
  selector: 'lfb-radio-widget',
  template: `<div class="widget form-group">
    <lfb-title [title]="schema.title" [helpMessage]="schema.description"></lfb-title>
    <div class="container">
      <div class="row">
        <div *ngFor="let option of schema.oneOf" class="radio">
          <label class="horizontal control-label">
            <input [formControl]="control" [attr.name]="name" [attr.id]="id + '.' + option.enum[0]"
                   value="{{option.enum[0]}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
            {{option.description}}
          </label>
        </div>
        <div *ngFor="let option of schema.enum" class="radio" [ngClass]="{col: schema.widget.layout === 'row'}">
          <input [formControl]="control" [attr.name]="name" [attr.id]="id + '.' + option"
                 value="{{option}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
          <lfb-label [for]="id + '.' + option" class="horizontal control-label" [title]="option"></lfb-label>
        </div>
      </div>
    </div>
	<input *ngIf="schema.readOnly" [attr.name]="name" type="hidden" [formControl]="control">
</div>`,
  styles: [`
    lfb-label {
      margin-left: .3rem;
    }
  `]
})
export class RadioComponent extends ControlWidget {}
