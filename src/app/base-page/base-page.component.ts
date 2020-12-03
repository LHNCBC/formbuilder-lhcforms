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
          <app-form-fields></app-form-fields>
        </ng-container>
        <app-item-component *ngIf="guidingStep === 'item-editor'"></app-item-component>
      </div>
      <app-footer id="fixedBottom"></app-footer>
    </div>

    <ng-template #home>
      <div class="card-body d-">
        <div>
          <p class="lead">How do you want to create your form?</p>
          <ul class="list-unstyled ml-5">
            <li>
              <label class="radio control-label">
                <input class="item-type-radio-button"
                       [(ngModel)]="startOption" value="scratch" type="radio">
                Start from scratch
              </label>
            </li>
            <li>
              <label class="radio control-label">
                <input class="item-type-radio-button"
                       [(ngModel)]="startOption" value="existing" type="radio">
                Start with existing form
              </label>
              <ul *ngIf="startOption === 'existing'" class="list-unstyled ml-5">
                <li>
                  <label class="radio control-label">
                    <input class="item-type-radio-button" [(ngModel)]="importOption" value="local" type="radio">
                    Import from local file
                  </label><br/>
                </li>
                <li>
                  <label class="radio control-label">
                    <input class="item-type-radio-button" [(ngModel)]="importOption" value="fhirServer" type="radio">
                    Import from FHIR server
                  </label><br/>
                </li>
                <li>
                  <label class="radio control-label">
                    <input class="item-type-radio-button" [(ngModel)]="importOption" value="loinc" type="radio">
                    Import from LOINC
                  </label><br/>
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
    `]
})
export class BasePageComponent implements OnInit {

  @Input()
  guidingStep = 'home'; // 'choose-start', 'home', 'item-editor'
  startOption = 'scratch';
  importOption = '';

  constructor() {}

  setStep(step) {
    this.guidingStep = step;
  }

  ngOnInit(): void {
  }

  onContinue() {
      this.guidingStep = 'choose-start';
  }
}
