import { Component, OnInit } from '@angular/core';
import {ExtensionsComponent} from '../extensions/extensions.component';
import {fhir} from '../../../fhir';


@Component({
  selector: 'lfb-total-score',
  template: `
    <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
      <lfb-label *ngIf="!nolabel"
                 [for]="id"
                 [title]="schema.title"
                 [helpMessage]="schema.description"
                 [ngClass]="labelWidthClass+' pl-0 pr-1'"
      ></lfb-label>
      <div class="{{controlWidthClass}} p-0">
        <input type="checkbox" [ngModel]="selected" (ngModelChange)="onChange($event)">
      </div>
    </div>
  `,
  styles: [
  ]
})
export class TotalScoreComponent extends ExtensionsComponent implements OnInit {

  dummyTotalScore: any [] = [{
    url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression',
    valueExpression: {
      description: '',
      name: 'testCalculatedExpression',
      language: 'text/fhirpath',
      expression: 'test expression'
    }
  }];
  selected = false;
  constructor() { super(); }

  ngOnInit(): void {
  }

  onChange(selected) {
    if(selected) {

    }

  }
}
