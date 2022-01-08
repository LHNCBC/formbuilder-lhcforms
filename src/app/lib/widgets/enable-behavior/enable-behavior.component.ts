/**
 * Widget to represent enableBehaviour field.
 */
import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-enable-behavior',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else displayTemplate"
           [attr.name]="name" type="hidden" [formControl]="control">
    <ng-template #displayTemplate>
      <div class="row">
        <div [ngClass]="schema.widget.labelWidthClass"></div>
        <div [ngClass]="schema.widget.controlWidthClass">
          <lfb-label [helpMessage]="schema.description" [title]="schema.title"></lfb-label>
          <div [ngClass]="{row: schema.widget.layout === 'row'}">
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
              <lfb-label [for]="id + '.' + option" class="horizontal control-label ml-sm-2" [title]="displayTexts[option]"></lfb-label>
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
    any: 'Any condition is true'
  }
}
