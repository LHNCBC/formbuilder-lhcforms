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

        <div ngbRadioGroup class="form-check-inline btn-group btn-group-sm btn-group-toggle"
             [ngModel]="bool"
             (ngModelChange)="boolChange.emit($event)"
             [ngModelOptions]="{standalone: true}">
          <ng-container *ngFor="let option of ['No', 'Yes']">
            <label ngbButtonLabel class="btn-outline-success" [attr.id]="'booleanControlled_'+option+_id">
              <input ngbButton
                     [value]="option === 'Yes'" type="radio" [attr.disabled]="disabled ? '' : null">
              {{option}}
            </label>
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
