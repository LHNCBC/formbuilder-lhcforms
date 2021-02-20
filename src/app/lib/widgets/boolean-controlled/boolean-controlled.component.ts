/**
 * A boolean control typically to trigger hide and show of a sibling component.
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-boolean-controlled',
  template: `
    <ng-template #controller>
      <div class="widget" [ngClass]="{'row': labelPosition === 'left'}">
        <div [ngClass]="labelWidthClass">
          <app-label [title]="label" [helpMessage]="helpMessage"></app-label>
        </div>

        <div [ngClass]="controlWidthClass" class="row">
          <div *ngFor="let option of ['No', 'Yes']" class="radio">
            <label class="horizontal control-label">
              <input [ngModel]="bool" (ngModelChange)="boolChange.emit($event)" [attr.id]="option+'_1'"
                     [value]="option === 'Yes'" type="radio" [attr.disabled]="disabled ? '' : null">
              {{option}}
            </label>
          </div>
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
  `]
})
export class BooleanControlledComponent  {
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
