import {Component, Input} from '@angular/core';
import { MainContentComponent } from './main-content/main-content.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ng-json-editor';
  @Input()
  guidingStep = ''; // 'chooseStart', 'home',

  constructor() {
  }

  setStep(step) {
    this.guidingStep = step;
  }


}
