import { Component, OnInit, Input } from '@angular/core';
import {WidgetChooserComponent} from 'ngx-schema-form';

@Component({
  selector: 'app-element-chooser',
  template: `<div #target></div>`,
  styles: []
})
export class ElementChooserComponent extends WidgetChooserComponent {
  @Input()
  nolabel = true;
}
