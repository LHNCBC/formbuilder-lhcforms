import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AppControlWidgetComponent} from './app-control-widget.component';

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
                     [value]="option === 'Yes'" type="radio" [disabled]="disabled">
              {{option}}
            </label>
          </div>

          <!--
          <mat-radio-group aria-label="Use code?" [ngModel]="bool" (ngModelChange)="boolChange.emit($event)">
            <mat-radio-button color="primary" *ngFor="let option of ['No', 'Yes']" [value]="option === 'Yes'">
              {{option}}
            </mat-radio-button>
          </mat-radio-group>
          -->
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
  @Input()
  bool: boolean;
  @Output()
  boolChange = new EventEmitter<boolean>();
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
}
