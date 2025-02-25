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
export class LabelRadioComponent extends LfbControlWidgetComponent {

}
