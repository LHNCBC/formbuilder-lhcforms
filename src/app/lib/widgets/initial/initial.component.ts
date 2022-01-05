/**
 * Handles FHIR initial field interaction in the item level form.
 */
import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-initial',
  templateUrl: './../table/table.component.html',
  styleUrls: ['./../table/table.component.css']
})
export class InitialComponent extends TableComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor() {
    super();
  }
}
