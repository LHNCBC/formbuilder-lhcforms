import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {NgbDatepickerConfig} from '@ng-bootstrap/ng-bootstrap';
import {BasePageComponent} from "./base-page/base-page.component";
import {FormService} from "./services/form.service";

@Component({
  standalone: false,
  selector: 'lfb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('basePage') basePageComponent: BasePageComponent;
  title = 'formbuilder-lhcforms';
  dateConfig = inject(NgbDatepickerConfig);
  formService = inject(FormService);
  constructor() {
    const today = new Date();
    this.dateConfig.minDate = {year: today.getUTCFullYear() - 100, month: today.getUTCMonth()+1, day: today.getUTCDate()};
    this.dateConfig.maxDate = {year: today.getUTCFullYear() + 100, month: today.getUTCMonth()+1, day: today.getUTCDate()};
  }

  /**
   * Initialize the form service. Form service needs to be initialized before any forms are
   * created. The initialization is asynchronous because it may need to load
   * external resources. Here we initialize it when the app component is initialized.
   */
  ngOnInit() {
    this.formService.initialize().then((bool: boolean) => {
    }).catch((reason) => {
      throw new Error(reason);
    });
  }
}
