/**
 * A boolean control typically to trigger hide and show of a sibling component.
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  standalone: false,
  selector: 'lfb-boolean-controlled',
  template: `
    <ng-template #controller>
      <div class="widget" [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        <lfb-label [title]="label"
                   [for]="'booleanControlled_'+_id"
                   [helpMessage]="helpMessage"
                   [ngClass]="labelClasses"
                   [labelId]="'label_booleanControlled_'+_id"
        ></lfb-label>

        <div [ngClass]="controlClasses" role="radiogroup"
             [attr.aria-labelledby]="'label_booleanControlled_'+_id" [attr.id]="'booleanControlled_'+_id">
          <ng-container *ngFor="let option of ['No', 'Yes']" >
            <input
              autocomplete="off"
              [attr.id]="'booleanControlled_'+option+_id"
              name="booleanControlled_{{_id}}"
              class="btn-check"
              [ngModel]="bool"
              (ngModelChange)="bool=$event; boolChange.emit($event)"
              [ngModelOptions]="{standalone: true}"
              [value]="option === 'Yes'" type="radio" [attr.disabled]="disabled ? '' : null">
            <label class="btn btn-outline-success" [attr.for]="'booleanControlled_'+option+_id">{{option}}</label>
          </ng-container>
        </div>
      </div>
    </ng-template>

    <ng-container *ngTemplateOutlet="controller"></ng-container>
    `
})
export class BooleanControlledComponent  {
  static ID = 0;
  _id = BooleanControlledComponent.ID++;
  // Properties for layout, typically to be read from layout schema file.
  @Input()
  bool: boolean;
  @Input()
  label: string;
  @Input()
  labelPosition = 'left';
  @Input()
  helpMessage: string;
  @Input()
  labelClasses: string;
  @Input()
  controlClasses: string;
  @Input()
  disabled = false;

  @Output()
  boolChange = new EventEmitter<boolean>();
}
