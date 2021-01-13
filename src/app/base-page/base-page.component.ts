import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-base-page',
  template: `
    <div>
      <app-header id="fixedTop" [isFirebaseEnabled]="true"></app-header>
      <div id="resizableMiddle">
        <ng-container *ngIf="guidingStep === 'home'">
          <ng-container *ngTemplateOutlet="home"></ng-container>
        </ng-container>
        <ng-container *ngIf="guidingStep === 'choose-start'">
          <ng-container *ngTemplateOutlet="formLevelFields"></ng-container>
        </ng-container>
        <ng-container *ngIf="guidingStep === 'item-editor'">
          <ng-container *ngTemplateOutlet="itemLevelFields"></ng-container>
        </ng-container>
      </div>
      <app-footer id="fixedBottom"></app-footer>
    </div>

    <ng-template #home>
      <div class="card-body container">
        <div>
          <p class="lead">How do you want to create your form?</p>
          <ul class="list-unstyled ml-5" ngbRadioGroup [(ngModel)]="startOption" >
            <li>
              <label ngbButtonLabel>
                <input ngbButton value="scratch" type="radio">
                Start from scratch
              </label>
            </li>
            <li>
              <label ngbButtonLabel>
                <input ngbButton value="existing" type="radio">
                Start with existing form
              </label>
              <ul *ngIf="startOption === 'existing'" class="list-unstyled ml-5"  ngbRadioGroup [(ngModel)]="importOption" >
                <li>
                  <label ngbButtonLabel>
                    <input ngbButton value="local" type="radio">
                    Import from local file
                  </label>
                </li>
                <li>
                  <label ngbButtonLabel>
                    <input ngbButton value="fhirServer" type="radio">
                    Import from FHIR server
                  </label>
                </li>
                <li>
                  <label ngbButtonLabel>
                    <input ngbButton value="loinc" type="radio">
                    Import from LOINC
                  </label>
                </li>
              </ul>
            </li>
          </ul>
          <hr>
          <div class="btn-toolbar float-right" role="toolbar" aria-label="Toolbar with button groups">
            <div class="btn-group" role="group" aria-label="Last group">
              <button type="button" class="btn btn-primary" (click)="onContinue()">Continue</button>
            </div>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #formLevelFields>
      <app-form-fields></app-form-fields>
    </ng-template>

    <ng-template #itemLevelFields>
      <app-item-component></app-item-component>
    </ng-template>
  `,
  styles: [`
    #fixedTop {
      position:absolute;
      top:0;
      left:0;
      height:84px;
      right:0;
      overflow:hidden;
    }

    #fixedBottom {
      position:absolute;
      bottom:0;
      height:65px;
      left:0;
      right:0;
      overflow:hidden;
    }

    #resizableMiddle {
      position:absolute;
      top:84px;
      bottom:65px;
      left:0;
      right:0;
      overflow:auto;
    }

    .radio-group {
      border: lightgray 1px solid;
      vertical-align: center;
      margin: 5px 0 5px 0;
    }
    .radio-button {
      margin: 5px;
    }
  `]
})
export class BasePageComponent {

  @Input()
  guidingStep = 'home'; // 'choose-start', 'home', 'item-editor'
  startOption = 'scratch';
  importOption = '';
  editMode = 'fresh';

  constructor() {}

  /**
   * Switch guiding step
   * @param step
   */
  setStep(step) {
    this.guidingStep = step;
  }

  /**
   * Handle continue button.
   */
  onContinue() {
    // TODO - Rethink the logic.
    if (this.startOption === 'scratch') {
      this.guidingStep = 'choose-start';
    } else if (this.startOption === 'existing' && this.importOption === 'loinc') {
      this.guidingStep = 'choose-start';
    }
  }
}
