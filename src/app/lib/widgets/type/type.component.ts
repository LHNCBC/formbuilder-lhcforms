import { Component, OnInit } from '@angular/core';
import {SelectComponent} from '../select/select.component';
import {FormService} from '../../../services/form.service';

@Component({
  selector: 'lfb-type',
  templateUrl: '../select/select.component.html'
})
export class TypeComponent extends SelectComponent implements OnInit {

  constructor(private formService: FormService) {
    super();
  }

  ngOnInit(): void {
    this.formProperty.valueChanges.subscribe((type) => {
      const initialProp = this.formProperty.findRoot().getProperty('initial');
      const widget = initialProp.schema.widget;
      widget.id = (type === 'choice' || type === 'open-choice') ? 'hidden' : 'initial';
      const hasChildren = this.formService.doesFocussedNodeHaveChildren();
      if(hasChildren) {
        if(type === 'display') {
          this.formProperty.setValue('group', true);
        }
      }
      else {
        if(type === 'group') {
          this.formProperty.setValue('display', true);
        }
      }
    });
  }

}
