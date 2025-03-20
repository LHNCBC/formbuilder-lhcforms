/**
 * Widget to represent enableBehaviour field.
 */
import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-enable-behavior',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else displayTemplate"
           name="{{name}}" type="hidden" [formControl]="control">
    <ng-template #displayTemplate>
      <div class="row">
        <div [ngClass]="schema.widget.labelWidthClass"></div>
        <div [ngClass]="schema.widget.controlWidthClass">
          <lfb-label [helpMessage]="schema.description" [title]="schema.title"
                     [labelId]="'label_'+id" [for]="id"></lfb-label>
          <div [ngClass]="{row: schema.widget.layout === 'row'}"
               role="radiogroup" [attr.aria-labelledby]="'label_'+id" [attr.id]="id">
            <div *ngFor="let option of schema.oneOf">
              <label class="horizontal control-label">
                <input [formControl]="control" [attr.id]="id + '.' + option.enum[0]"
                       value="{{option.enum[0]}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
                {{option.description}}
              </label>
            </div>
            <div *ngFor="let option of schema.enum" [ngClass]="{col: schema.widget.layout === 'row'}">
              <input [formControl]="control" [attr.id]="id + '.' + option" name="{{id}}"
                     value="{{option}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
              <lfb-label [for]="id + '.' + option" class="horizontal control-label ms-sm-2" [title]="displayTexts[option]"></lfb-label>
            </div>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [
  ]
})
export class EnableBehaviorComponent extends LfbControlWidgetComponent {
  displayTexts = {
    all: 'All conditions are true',
    any: 'Any condition is true',
    hidden: 'Hide',
    protected: 'Show as protected'
  }
}
