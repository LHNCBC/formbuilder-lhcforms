import { Component } from '@angular/core';

import { ControlWidget } from 'ngx-schema-form';

@Component({
  selector: 'app-radio-widget',
  template: `<div class="widget form-group">
    <app-title [title]="schema.title" [helpMessage]="schema.description"></app-title>
    <div class="container">
      <div class="row">
        <div *ngFor="let option of schema.oneOf" class="radio">
          <label class="horizontal control-label">
            <input [formControl]="control" [attr.name]="name" [attr.id]="id + '.' + option.enum[0]"
                   value="{{option.enum[0]}}" type="radio"  [disabled]="schema.readOnly||option.readOnly">
            {{option.description}}
          </label>
        </div>
        <div *ngFor="let option of schema.enum" class="radio" [ngClass]="{col: schema.widget.layout === 'row'}">
          <input [formControl]="control" [attr.name]="name" [attr.id]="id + '.' + option"
                 value="{{option}}" type="radio"  [disabled]="schema.readOnly||option.readOnly">
          <app-label [for]="id + '.' + option" class="horizontal control-label" [title]="option"></app-label>
        </div>
      </div>
    </div>
	<input *ngIf="schema.readOnly" [attr.name]="name" type="hidden" [formControl]="control">
</div>`,
  styles: [`
    app-label {
      margin-left: .3rem;
    }
  `]
})
export class RadioComponent extends ControlWidget {}
