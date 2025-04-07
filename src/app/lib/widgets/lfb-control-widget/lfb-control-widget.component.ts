/**
 * Customize array-widget from ngx-schema-form.
 */
import {Component, Input, OnInit} from '@angular/core';
import {ControlWidget} from '@lhncbc/ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: false,
  selector: 'lfb-control-widget',
  template: `
  `,
  styles: [
  ]
})
export class LfbControlWidgetComponent extends ControlWidget implements OnInit {
  // Info icon
  faInfo = faInfoCircle;

  // Properties to customize the layout, typically read from widget layout json.
  @Input()
  nolabel = false;
  @Input()
  labelPosition;
  @Input()
  labelWidthClass: string;
  @Input()
  controlWidthClass: string;
  @Input()
  controlClasses: string;
  @Input()
  labelClasses: string;
  @Input()
  booleanControlled = false;
  @Input()
  booleanLabel: string;
  @Input()
  booleanControlledInitial = true;

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
    this.labelClasses = this.labelClasses || widget.labelClasses || '';
    this.controlClasses = this.controlClasses || widget.controlClasses || '';
    this.booleanControlled = this.booleanControlled ? this.booleanControlled : !!widget.booleanControlled;

    this.booleanControlledInitial = widget.booleanControlledInitial !== undefined ?
      widget.booleanControlledInitial : this.booleanControlledInitial; // If not defined, show the control.
  }
}
