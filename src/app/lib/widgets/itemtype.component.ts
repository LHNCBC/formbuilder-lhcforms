import {Component, Input, EventEmitter, OnInit, Output, AfterViewInit} from '@angular/core';
import {FormProperty, FormPropertyFactory, SelectWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-itemtype',
  template: `
      <div class="form-row">
        <div class="widget form-group col-8">
          <app-label title="Item type" helpMessage="Select the type of item"></app-label>
          <div class="item-type-radio-group align-middle rounded">
            <div class="form-row">
              <div *ngFor="let option of itemTypes" class="col-4">
                <label class="radio-inline horizontal control-label">
                  <input  class="item-type-radio-button" [attr.id]="'itemType.' + option"
                         [(ngModel)]="itemType" (change)="onItemTypeChange(option)" value="{{option}}" type="radio">
                  {{option}}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="itemType === 'question'" class="widget form-group form-group-sm col">
          <app-label  *ngIf="!nolabel" [for]="id" [title]="schema.title" [helpMessage]="schema.description"></app-label>
          <select *ngIf="schema.type!='array'" [formControl]="control"
                  [attr.name]="name" [attr.id]="id"
                  [disabled]="schema.readOnly" [disableControl]="schema.readOnly" class="form-control">
            <ng-container *ngIf="schema.oneOf; else use_enum">
              <option *ngFor="let option of schema.oneOf" [ngValue]="option.enum[0]" >{{option.description}}</option>
            </ng-container>
            <ng-template #use_enum>
              <ng-container *ngFor="let option of schema.enum">
                <option *ngIf="option !== 'display' && option !== 'group'" [ngValue]="option">{{option}}</option>
              </ng-container>
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
        </div>
      </div>
  `,
  styles: [`
    .item-type-radio-group {
      border: lightgray 1px solid;
      vertical-align: center;
      padding-top: 3px;
    }
    .item-type-radio-button {
      margin: 5px;
    }
`
]
})
export class ItemtypeComponent extends SelectWidget implements AfterViewInit {
  faInfo = faInfoCircle;

  @Input()
  nolabel = false;
  itemTypes: string[] = ['group', 'display', 'question'];
  itemType: string;

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.formProperty.valueChanges.subscribe((val) => {
      this.itemType = this.itemTypeFromType(val);
    });
  }

  itemTypeFromType(type) {
    return (type === 'display' || type === 'group') ? type : 'question';
  }

  onItemTypeChange(option) {
    this.itemType = option;
    console.log(option);
    if (option === 'question') {
      this.formProperty.reset('string', true);
    } else {
      this.formProperty.setValue(option, true);
    }
  }
}
