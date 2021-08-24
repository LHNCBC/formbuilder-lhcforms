/**
 * Handles FHIR initial field interaction in the item level form.
 */
import {AfterViewInit, Component, OnInit} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {AppJsonPipe} from '../../pipes/app-json.pipe';

@Component({
  selector: 'lfb-initial',
  templateUrl: './../table/table.component.html',
  styleUrls: ['./../table/table.component.css']
})
export class InitialComponent extends TableComponent implements OnInit, AfterViewInit {

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

  ngOnInit() {
    super.ngOnInit();
    this.formProperty.searchProperty('/type').valueChanges.subscribe((newValue) => {
      const widget = this.formProperty.schema.widget;
      widget.id = InitialComponent.typeMap[newValue];
      widget.noHeader = true;
      console.log('initial widget id: '+this.formProperty.schema.widget.id);
    });
  }

  ngOnAfterViewInit(): void {
    super.ngAfterViewInit();
  }
}
