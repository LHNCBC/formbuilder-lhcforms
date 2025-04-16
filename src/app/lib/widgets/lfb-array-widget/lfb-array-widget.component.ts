/**
 * Customize array-widget from ngx-schema-form. ArrayWidget represents a component
 * with array of objects, typically like a table of rows with columns.
 */
import {AfterViewInit, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ArrayWidget} from '@lhncbc/ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {Subscription} from 'rxjs';

@Component({
  standalone: false,
  selector: 'lfb-array-widget',
  template: `
  `,
  styles: [
  ]
})
export class LfbArrayWidgetComponent extends ArrayWidget implements OnInit, AfterViewInit, OnDestroy {
  // Info icon
  subscriptions: Subscription [] = [];
  faInfo = faInfoCircle;
  // Properties to customize the layout, typically read from layout schema json.
  @Input()
  nolabel = false;
  @Input()
  labelPosition: string;
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
    if(Array.isArray(this.formProperty.properties) && this.formProperty.properties.length === 0) {
      this.formProperty.addItem();
    }
    const widget = this.formProperty.schema.widget;
    this.labelClasses = this.labelClasses || widget.labelClasses || '';
    this.controlClasses = this.controlClasses || widget.controlClasses || '';
  }

  /**
   * This is a base class for all array type components.
   * While initializations are done in ngOnInit(), add all subscriptions in ngAfterViewInit().
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    const sub = this.formProperty.valueChanges.subscribe((vals) => {
      this.updateWidget();
    });
    this.subscriptions.push(sub);
  }

  /**
   * Read/update widget attributes from schema.
   */
  updateWidget() {
    const widget = this.formProperty.schema.widget;
    // Input is priority followed by widget definition and default
    this.labelPosition = this.labelPosition || widget.labelPosition || 'top';

    // Apply width classes for only left positioned labels.
    this.labelWidthClass =
      this.labelPosition === 'left'
        ? (this.labelWidthClass || widget.labelWidthClass || 'col-sm')
        : '';

    this.controlWidthClass =
      this.labelPosition === 'left'
        ? (this.controlWidthClass || widget.controlWidthClass || 'col-sm')
        : '';

    this.booleanControlled = this.booleanControlled || !!widget.booleanControlled;
    this.booleanLabel = this.booleanLabel || widget.booleanLabel;

    this.booleanControlledInitial = widget.booleanControlledInitial !== undefined ?
      widget.booleanControlledInitial : this.booleanControlledInitial; // If not defined, show the control.
  }

  /**
   * Cleanup, including freeing up all subscriptions.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub?.unsubscribe();
    })
  }
}
