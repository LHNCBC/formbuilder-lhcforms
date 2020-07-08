import {Component, Input, OnInit} from '@angular/core';
import {ControlWidget} from 'ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-control-widget',
  template: `
  `,
  styles: [
  ]
})
export class AppControlWidgetComponent extends ControlWidget implements OnInit {
  faInfo = faInfoCircle;
  @Input()
  nolabel = false;
  @Input()
  labelPosition;
  @Input()
  labelWidthClass: string;
  @Input()
  controlWidthClass: string;

  ngOnInit() {
    const widget = this.formProperty.schema.widget;
    // Input is priority followed by widget definition and default
    this.labelPosition =
      this.labelPosition
        ? this.labelPosition
        : widget.labelPosition
        ? widget.labelPosition
        : 'top';
    // Apply width classes for only left positioned labels.
    this.labelWidthClass =
      this.labelPosition === 'left'
        ? (this.labelWidthClass
        ? this.labelWidthClass
        : (widget.labelWidthClass
          ? widget.labelWidthClass
          : 'col-sm'))
        : '';
    this.controlWidthClass =
      this.labelPosition === 'left'
        ? (this.controlWidthClass
        ? this.controlWidthClass
        : (widget.controlWidthClass
          ? widget.controlWidthClass
          : 'col-sm'))
        : '';
  }
}
