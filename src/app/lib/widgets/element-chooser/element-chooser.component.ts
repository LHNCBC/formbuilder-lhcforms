import { Component, OnInit, Input } from '@angular/core';
import {WidgetChooserComponent} from 'ngx-schema-form';

@Component({
  selector: 'lfb-element-chooser',
  template: `<div #target></div>`,
  styles: []
})
export class ElementChooserComponent extends WidgetChooserComponent {
  @Input()
  nolabel = true;
  @Input()
  layout: string;
  @Input()
  labelWidthClass: string;
  @Input()
  controlWidthClass: string;
  @Input()
  booleanControlled = false;
  @Input()
  booleanLabel: string;
}
