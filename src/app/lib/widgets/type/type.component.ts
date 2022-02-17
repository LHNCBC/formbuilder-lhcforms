import { Component, OnInit } from '@angular/core';
import {SelectComponent} from '../select/select.component';

@Component({
  selector: 'lfb-type',
  templateUrl: '../select/select.component.html'
})
export class TypeComponent extends SelectComponent implements OnInit {

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.formProperty.valueChanges.subscribe((type) => {
      const initialProp = this.formProperty.findRoot().getProperty('initial');
      const widget = initialProp.schema.widget;
      widget.id = (type === 'choice' || type === 'open-choice') ? 'hidden' : 'initial';
      // Internally represent display type as group. Identifying display/group type is differed until
      // the form is converted to json output.
      if(type === 'display') {
        this.formProperty.setValue('group', true);
      }
    });
  }

}
