import { Component, OnInit } from '@angular/core';
import {StepperGridComponent} from './stepper-grid.component';

@Component({
  selector: 'app-expandable-panels',
  template: `
    <ngb-accordion #acc="ngbAccordion" activeIds="ngb-panel-0">
      <ngb-panel *ngFor="let step of steps; let firstStep = first; let lastStep = last"
                [title]="step.title">
        <ng-template ngbPanelContent>
          <div class="form-group row" *ngFor="let stepRow of step.rows">
            <div [class]="gridClass(field)" *ngFor="let field of getShowFields(stepRow)">
              <app-form-element [formProperty]="getShowFieldProperty(field)"></app-form-element>
            </div>
          </div>
        </ng-template>
      </ngb-panel>
    </ngb-accordion>
  `,
  styles: [`
    :host ::ng-deep .card-header {
      padding: 0;
    }
    :host ::ng-deep .card-header button {
      padding: 0.2rem;
    }
    :host ::ng-deep .card-body {
      padding: 1rem;
    }

    :host ::ng-deep .form-group {
      margin-bottom: 0;
    }
  `]
})
export class ExpandablePanelsComponent extends StepperGridComponent implements OnInit {

  ngOnInit(): void {
    super.ngOnInit();
  }

}
