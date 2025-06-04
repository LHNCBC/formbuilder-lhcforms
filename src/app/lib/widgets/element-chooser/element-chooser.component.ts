import { Component, OnInit, Input } from '@angular/core';
import {SchemaFormModule, WidgetChooserComponent} from '@lhncbc/ngx-schema-form';

@Component({
  imports: [SchemaFormModule],
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
