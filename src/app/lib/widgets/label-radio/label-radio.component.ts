/**
 * Customize ngx-schema-form radio component, mainly the layout.
 */
import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-label-radio',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           [attr.name]="name" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        <lfb-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass + ' pl-0 pr-1'"
        ></lfb-label>
        <div class="form-check-inline btn-group btn-group-sm btn-group-toggle" >
            <label *ngFor="let option of schema.oneOf" class="btn btn-outline-success">
              <input [attr.id]="id + '.' + option.enum[0]" [formControl]="control" class="btn-check"
                     type="radio" [value]="option" [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
              {{option.description}}
            </label>
            <label *ngFor="let option of schema.enum" class="btn btn-outline-success">
              <input [attr.id]="id + '.' + option" [formControl]="control" class="btn-check"
                     type="radio" [value]="option" [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
              <span class="ml-1 mr-3">{{option}}</span>
            </label>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    lfb-label {
      /* margin-left: .3rem; */
    }
  `]
})
export class LabelRadioComponent extends LfbControlWidgetComponent {

}
