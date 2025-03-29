/**
 * Customize ngx-schema-form radio component, mainly the layout.
 */
import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-label-radio',
  templateUrl: './label-radio.component.html'
})
export class LabelRadioComponent extends LfbControlWidgetComponent implements OnInit {

  labels = {};
  ngOnInit() {
    super.ngOnInit();
    this.formProperty.schema.enum?.forEach((option) => {
      this.labels[option] = this.formProperty.schema.widget?.labels?.[option] || option;
    });
  }
}
