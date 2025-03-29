import {Component, ViewChild} from '@angular/core';
import {NgbDatepickerConfig} from '@ng-bootstrap/ng-bootstrap';
import {BasePageComponent} from "./base-page/base-page.component";

@Component({
  standalone: false,
  selector: 'lfb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('basePage') basePageComponent: BasePageComponent;
  title = 'formbuilder-lhcforms';
  constructor(private dateConfig: NgbDatepickerConfig) {
    const today = new Date();
    dateConfig.minDate = {year: today.getUTCFullYear() - 100, month: today.getUTCMonth()+1, day: today.getUTCDate()};
    dateConfig.maxDate = {year: today.getUTCFullYear() + 100, month: today.getUTCMonth()+1, day: today.getUTCDate()};
  }
}
