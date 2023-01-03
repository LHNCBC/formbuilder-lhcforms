/**
 * A boolean control typically to trigger hide and show of a sibling component.
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'lfb-boolean-controlled',
  template: `
    <ng-template #controller>
      <div class="widget" [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
        <lfb-label [title]="label"
                   [helpMessage]="helpMessage"
                   [ngClass]="labelWidthClass + ' pl-0 pr-1'"
        ></lfb-label>

        <div class="btn-group btn-group-sm" role="radiogroup" [attr.aria-label]="label">
          <ng-container *ngFor="let option of ['No', 'Yes']" >
            <input
              autocomplete="off"
              [attr.id]="'booleanControlled_'+option+_id"
              class="btn-check"
              [ngModel]="bool"
              (ngModelChange)="boolChange.emit($event)"
              [value]="option === 'Yes'" type="radio" [attr.disabled]="disabled ? '' : null">
            <label class="btn btn-outline-success" [attr.for]="'booleanControlled_'+option+_id">{{option}}</label>
          </ng-container>
        </div>
      </div>
    </ng-template>

    <ng-container *ngTemplateOutlet="controller"></ng-container>
    `,
  styles: [`
    .radio ~ .radio {
      margin-left: 16px;
    }
    .radio {
      font-size: 0.875rem
    }
    label:hover {
      opacity: 0.5;
    }
  `]
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
  labelWidthClass: string;
  @Input()
  controlWidthClass: string;
  @Input()
  disabled = false;

  @Output()
  boolChange = new EventEmitter<boolean>();
}
