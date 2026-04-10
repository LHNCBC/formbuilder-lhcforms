/**
 * Customize ngx-schema-form radio component, mainly the layout.
 */
import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ReactiveFormsModule} from "@angular/forms";
import {LabelComponent} from "../label/label.component";
import {NgClass} from "@angular/common";

@Component({
  selector: 'lfb-label-radio',
  imports: [ReactiveFormsModule, LabelComponent, NgClass],
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
