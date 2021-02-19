/**
 * Customized pull down box.
 */
import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {SelectWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {AppControlWidgetComponent} from '../app-control-widget/app-control-widget.component';


@Component({
  selector: 'app-select',
  template: `
    <ng-template #baseSelect>
      <div [ngClass]="{'row': labelPosition === 'left'}">
        <app-label  *ngIf="!nolabel"
                    [for]="id"
                    [title]="schema.title"
                    [helpMessage]="schema.description"
                    [ngClass]="labelWidthClass"
        ></app-label>
        <select *ngIf="schema.type!='array'"
                [formControl]="control"
                [attr.name]="name"
                [attr.id]="id"
                [disabled]="schema.readOnly"
                [disableControl]="schema.readOnly"
                class="form-control {{controlWidthClass}}">
          <ng-container *ngIf="schema.oneOf; else use_enum">
            <option *ngFor="let option of schema.oneOf"
                    [ngValue]="option.enum[0]" >{{option.description}}</option>
          </ng-container>
          <ng-template #use_enum>
            <option *ngFor="let option of allowedOptions"
                    [ngValue]="option.value" >{{option.label}}</option>
          </ng-template>
        </select>

        <select *ngIf="schema.type==='array'" multiple
                [formControl]="control"
                [attr.name]="name"
                [attr.id]="id"
                [disabled]="schema.readOnly"
                [disableControl]="schema.readOnly"
                class="form-control {{controlWidthClass}}">
          <option *ngFor="let option of schema.items.oneOf"
                  [ngValue]="option.enum[0]"
                  [disabled]="option.readOnly">{{option.description}}</option>
        </select>

        <input *ngIf="schema.readOnly" [attr.name]="name" type="hidden" [formControl]="control">
      </div>
    </ng-template>

    <ng-container *ngTemplateOutlet="baseSelect">

    </ng-container>
  `,
  styles: [`
  `]
})
export class SelectComponent extends AppControlWidgetComponent implements AfterViewInit {
  faInfo = faInfoCircle;
  nolabel = false;

  // A mapping for options display string. Typically, the display strings are from schema definition.
  // This map helps to redefine the display string.
  @Input()
  selectOptionsMap: any = {};

  // Options list for the pulldown
  allowedOptions: Array<{value: string, label: string}>;

  /**
   * Initialize component, mainly the options list.
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.selectOptionsMap = this.schema.widget.selectOptionsMap || {};
    const allowedOptions = this.schema.enum.map((e) => {
      return this.mapOption(e);
    });
    this.allowedOptions = allowedOptions.filter((e) => {
      return this.isIncluded(e.value);
    });
  }

  /**
   * Map any display strings.
   * @param opt
   */
  mapOption(opt: string): {value: string, label: string} {
    const ret = {value: opt, label: opt};
    if (this.selectOptionsMap.map && this.selectOptionsMap.map[opt]) {
      ret.label = this.selectOptionsMap.map[opt];
    }
    return ret;
  }

  /**
   * Optionally to exlude any options from the schema.
   * @param opt
   */
  isIncluded(opt: string): boolean {
    return !(this.selectOptionsMap.remove && this.selectOptionsMap.remove.indexOf(opt) >= 0);
  }
}
