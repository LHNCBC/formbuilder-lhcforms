import {Component, Input, OnInit} from '@angular/core';
import {ControlWidget, StringWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-string',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           [attr.name]="name" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'widget': true,'form-group': true}">
        <app-label  *ngIf="!nolabel" [for]="id" [title]="schema.title" [helpMessage]="schema.description"></app-label>
        <!-- <span *ngIf="schema.description" class="formHelp">{{schema.description}}</span> -->
        <input [name]="name" [attr.readonly]="(schema.widget.id!=='color') && schema.readOnly?true:null"
               class="text-widget.id textline-widget form-control"
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
export class StringComponent extends StringWidget implements OnInit {
  faInfo = faInfoCircle;
  @Input()
  nolabel = false;

  ngOnInit() {
    console.log('StringComponent widget', this.schema.widget);
  }
}
