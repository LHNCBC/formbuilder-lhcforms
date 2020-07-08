import {Component, Input, OnInit} from '@angular/core';
import {ControlWidget, StringWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {AppControlWidgetComponent} from './app-control-widget.component';

@Component({
  selector: 'app-string',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           [attr.name]="name" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'form-group': true, 'row': labelPosition === 'left'}">
        <app-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass"
        ></app-label>
        <!-- <span *ngIf="schema.description" class="formHelp">{{schema.description}}</span> -->
        <input [name]="name" [attr.readonly]="(schema.widget.id!=='color') && schema.readOnly?true:null"
               class="textline-widget form-control {{controlWidthClass}}"
               [attr.type]="!schema.widget.id || schema.widget.id === 'string' ? 'text' : schema.widget.id"
               [attr.id]="id"  [formControl]="control" [attr.placeholder]="schema.placeholder"
               [attr.maxLength]="schema.maxLength || null"
               [attr.minLength]="schema.minLength || null"
               [attr.required]="schema.isRequired || null"
               [attr.disabled]="(schema.widget.id=='color' && schema.readOnly)?true:null">
        <input *ngIf="(schema.widget.id==='color' && schema.readOnly)" [attr.name]="name" type="hidden" [formControl]="control">
      </div>
    </ng-template>
  `
})
export class StringComponent extends AppControlWidgetComponent {

  getInputType() {
    if (!this.schema.widget.id || this.schema.widget.id === 'string') {
      return 'text';
    } else {
      return this.schema.widget.id;
    }
  }
}
