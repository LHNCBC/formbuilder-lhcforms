/**
 * Handles FHIR initial field interaction in the item level form.
 */
import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {AppJsonPipe} from '../../pipes/app-json.pipe';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-initial',
  templateUrl: './../table/table.component.html',
  styleUrls: ['./../table/table.component.css']
})
export class InitialComponent extends TableComponent implements OnInit, AfterViewInit, OnDestroy {

  static typeMap = {
    string: 'string',
    boolean: 'boolean',
    decimal: 'number',
    integer: 'integer',
    date: 'string',
    dateTime: 'string',
    time: 'string',
    text: 'text',
    url: 'url',
    choice: 'hidden',
    'open-choice': 'hidden',
    attachment: 'hidden',
    reference: 'hidden',
    quantity: '',
    group: 'hidden',
    display: 'hidden'
  };

  subscriptions: Subscription [] = [];
  ngOnInit() {
    super.ngOnInit();
    const sub = this.formProperty.searchProperty('/type').valueChanges.subscribe((newValue) => {
      const widget = this.formProperty.schema.widget;
      widget.id = InitialComponent.typeMap[newValue];
      widget.noHeader = true;
    });

    this.subscriptions.push(sub);
  }

  ngOnAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  /**
   * Unsubsribe subscriptions
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
