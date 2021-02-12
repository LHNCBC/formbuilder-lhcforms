import { Component, OnInit } from '@angular/core';
import {AppControlWidgetComponent} from './app-control-widget.component';

/**
 * Customize ngx-schema-form radio component, mainly the layout.
 */
@Component({
  selector: 'app-label-radio',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           [attr.name]="name" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left'}">
        <app-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass"
        ></app-label>
        <!-- <span *ngIf="schema.description" class="formHelp">{{schema.description}}</span> -->
        <div class="{{controlWidthClass}} row">
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
    </ng-template>
  `,
  styles: [`
    app-label {
      margin-left: .3rem;
    }
  `]
})
export class LabelRadioComponent extends AppControlWidgetComponent {

}
