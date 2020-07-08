import { Component, OnInit } from '@angular/core';
import {GridComponent} from './grid.component';
import {Observable, of} from 'rxjs';
import {Util} from '../util';

@Component({
  selector: 'app-stepper-grid',
  template: `
    <mat-vertical-stepper>
      <mat-step *ngFor="let step of steps; let firstStep = first; let lastStep = last"
                [optional]="step.optional" [label]="step.title" [stepControl]="firstStep ? getMandatoryControl() : null" >
        <div class="form-row" *ngFor="let stepRow of step.rows">
          <div [class]="gridClass(field)" *ngFor="let field of getShowFields(stepRow)">
            <sf-form-element [formProperty]="getShowFieldProperty(field)"></sf-form-element>
          </div>
        </div>
        <!--
        <div>
          <button *ngIf="!firstStep" mat-button mat-stroked-button color="primary" matStepperPrevious type="button">Back</button>
          <button *ngIf="!lastStep"  mat-button mat-stroked-button color="primary" matStepperNext     type="button">Next</button>
        </div>
        -->
      </mat-step>
    </mat-vertical-stepper>
  `,
  styles: [`
    :host ::ng-deep .mat-vertical-stepper-header {
      padding: 12px;
    }

    :host ::ng-deep .mat-vertical-content {
      padding: 0 12px 12px 12px;
    }
  `]
})
export class StepperGridComponent extends GridComponent implements OnInit {

  steps: any [];
  completed: false;

  ngOnInit() {
    super.ngOnInit();
    this.formProperty.findRoot().getProperty('type').valueChanges.subscribe(() => {
      this.steps = this.getSteps();
    });
  }

  getMandatoryControl() {
    return this.formProperty.findRoot().getProperty('type').widget;
  }

  getSteps(): any [] {
    return this.formProperty.schema.steps.filter((step) => {
      let ret = false;
      for (const row of step.rows) {
        const fields = this.getVisibleFields(row);
        if (fields && fields.length > 0) {
          ret = true;
          break;
        }
      }
      return ret;
    });
  }

  getVisibleFields(row): string [] {
    let ret: string [] = [];
    if (row && row.showFields) {
      ret = row.showFields.filter((field) => {
        return Util.isVisible(this.formProperty, field.field);
      });
    }
    return ret;
  }


}
