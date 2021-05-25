/**
 * Component for general input box
 */
import {Component, Input, OnInit} from '@angular/core';
import {ControlWidget, StringWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-string',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           [attr.name]="name" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        <lfb-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass+' pl-0 pr-1'"
        ></lfb-label>
        <input [name]="name" [attr.readonly]="(schema.widget.id!=='color') && schema.readOnly?true:null"
               class="textline-widget form-control {{controlWidthClass}}"
               [attr.type]="!schema.widget.id || schema.widget.id === 'string' ? 'text' : schema.widget.id"
               [attr.id]="id"  [formControl]="control" [attr.placeholder]="schema.placeholder"
               [attr.maxLength]="schema.maxLength || null"
               [attr.minLength]="schema.minLength || null"
               [attr.required]="schema.isRequired ? '' : null"
               [attr.disabled]="schema.disabled ? '' : null">
      </div>
    </ng-template>
  `
})
export class StringComponent extends LfbControlWidgetComponent {
}
