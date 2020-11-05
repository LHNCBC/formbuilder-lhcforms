import {AfterViewInit, Component, OnInit} from '@angular/core';
import {StepperGridComponent} from './stepper-grid.component';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-expandable-panels',
  template: `
    <ngb-accordion #acc="ngbAccordion" activeIds="ngb-panel-0">
      <ngb-panel *ngFor="let step of steps; let firstStep = first; let lastStep = last">
        <ng-template ngbPanelTitle>
          <span>{{step.title}}</span>
          <span class="info-icon" *ngIf="step.description"  matTooltipPosition="above" [matTooltip]="step.description">
            <fa-icon [icon]="faInfo"></fa-icon>
          </span>
        </ng-template>
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
    span.info-icon {
      padding-left: .5rem;
    }
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
export class ExpandablePanelsComponent extends StepperGridComponent {

  faInfo = faInfoCircle;

}
