import { Component, OnInit } from '@angular/core';
import {SelectWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-select',
  template: `
    <div class="widget form-group form-group-sm">
      <app-label  *ngIf="!nolabel" [for]="id" [title]="schema.title" [helpMessage]="schema.description"></app-label>
      <select *ngIf="schema.type!='array'" [formControl]="control"
              [attr.name]="name" [attr.id]="id"
              [disabled]="schema.readOnly" [disableControl]="schema.readOnly" class="form-control">
		    <ng-container *ngIf="schema.oneOf; else use_enum">
          <option *ngFor="let option of schema.oneOf" [ngValue]="option.enum[0]" >{{option.description}}</option>
		    </ng-container>
		    <ng-template #use_enum>
          <option *ngFor="let option of schema.enum" [ngValue]="option" >{{option}}</option>
		    </ng-template>
      </select>

      <select *ngIf="schema.type==='array'" multiple
              [formControl]="control" [attr.name]="name"
              [attr.id]="id" [disabled]="schema.readOnly"
              [disableControl]="schema.readOnly" class="form-control">
        <option *ngFor="let option of schema.items.oneOf"
                [ngValue]="option.enum[0]"
                [disabled]="option.readOnly">{{option.description}}</option>
      </select>

	<input *ngIf="schema.readOnly" [attr.name]="name" type="hidden" [formControl]="control">
</div>`
})
export class SelectComponent extends SelectWidget {
  faInfo = faInfoCircle;
  nolabel = false;
}
