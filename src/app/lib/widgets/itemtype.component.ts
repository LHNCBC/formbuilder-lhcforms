import {Component, Input, EventEmitter, OnInit, Output, AfterViewInit} from '@angular/core';
import {FormProperty, FormPropertyFactory, SelectWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-itemtype',
  template: `
      <div>
        <div class="widget form-group row">
          <app-label class="col-sm-2" title="Item type" helpMessage="Select the type of item"></app-label>
          <div class="item-type-radio-group m-0 p-0 align-middle rounded col-sm-4">
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

        <div *ngIf="itemType === 'question'" class="widget form-group row">
          <app-label  *ngIf="!nolabel" [for]="id" [title]="schema.title" [helpMessage]="schema.description"
                      class="col-sm-2"></app-label>
          <select *ngIf="schema.type!='array'" [formControl]="control"
                  [attr.name]="name" [attr.id]="id"
                  [disabled]="schema.readOnly" [disableControl]="schema.readOnly"
                  class="form-control col-sm-4">
            <ng-container *ngIf="schema.oneOf; else use_enum">
              <option *ngFor="let option of schema.oneOf" [ngValue]="option.enum[0]" >{{option.description}}</option>
            </ng-container>
            <ng-template #use_enum>
              <ng-container *ngFor="let option of allowedOptions">
                <option [ngValue]="option">{{option}}</option>
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
      margin: 5px 0 5px 0;
    }
    .item-type-radio-button {
      margin: 5px;
    }
    label {
      margin-bottom: 0;
    }
`
]
})
export class ItemtypeComponent extends SelectWidget implements AfterViewInit {
  faInfo = faInfoCircle;

  @Input()
  nolabel = false;
  itemTypes: string[] = ['question', 'group', 'display'];
  itemType: string;
  allowedOptions: string [];

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.formProperty.valueChanges.subscribe((val) => {
      this.itemType = this.itemTypeFromType(val);
    });
    this.allowedOptions = this.schema.enum.filter((e) => e !== 'display' && e !== 'group' && e !== 'reference' && e !== 'attachment');
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
