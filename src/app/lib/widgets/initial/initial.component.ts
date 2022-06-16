/**
 * Handles FHIR initial field interaction in the item level form.
 */
import {AfterViewInit, Component, DoCheck, OnDestroy, OnInit} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-initial',
  templateUrl: './../table/table.component.html',
  styleUrls: ['./../table/table.component.css']
})
export class InitialComponent extends TableComponent implements DoCheck, OnDestroy {

  constructor() {
    super();
  }

  /**
   * Make sure there is at least one item in the table.
   */
  ngDoCheck() {
    if(this.formProperty.properties.length === 0) {
      this.addItem();
    }
  }
}
