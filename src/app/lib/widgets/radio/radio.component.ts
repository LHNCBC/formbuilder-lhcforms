/**
 * Customize the radio widget template.
 */
import { Component } from '@angular/core';

import { ControlWidget } from '@lhncbc/ngx-schema-form';

@Component({
  selector: 'lfb-radio-widget',
  template: `<div class="widget form-group">
    <lfb-title [title]="schema.title" [helpMessage]="schema.description"></lfb-title>
    <div class="container">
      <div class="row">
        <div *ngFor="let option of schema.oneOf" class="form-check form-check-inline">
          <input class="form-check-input" [formControl]="control" [attr.id]="id + '.' + option.enum[0]" name="{{id}}"
                   value="{{option.enum[0]}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
          <label class="form-check-label" [attr.for]="id + '.' + option.enum[0]">{{option.description}}</label>
        </div>
        <div *ngFor="let option of schema.enum" class="form-check form-check-inline" [ngClass]="{col: schema.widget.layout === 'row'}">
          <input class="form-check-input" [formControl]="control" [attr.id]="id + '.' + option" name="{{id}}"
                 value="{{option}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
          <lfb-label [for]="id + '.' + option" class="form-check-label" [title]="option"></lfb-label>
        </div>
      </div>
    </div>
	<input *ngIf="schema.readOnly" name="{{name}}" type="hidden" [formControl]="control">
</div>`,
  styles: [`
    lfb-label {
      margin-left: .3rem;
    }
  `]
})
export class RadioComponent extends ControlWidget {}
