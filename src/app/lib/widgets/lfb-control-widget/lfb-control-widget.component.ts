/**
 * Customize array-widget from ngx-schema-form.
 */
import {Directive, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlWidget} from '@lhncbc/ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {Subscription} from 'rxjs';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  DEFAULT_WIDGET_MODIFIED_MESSAGES,
  getModifiedErrorForPatternMismatch,
  mapWidgetErrors,
  ModifiedMessages,
  WidgetValidationError
} from '../../validation-utils';

import {Util} from '../../util';

@Directive()
export class LfbControlWidgetComponent extends ControlWidget implements OnInit, OnDestroy {

  static ID = 0;
  _id = (LfbControlWidgetComponent.ID++).toString();
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

  subscriptions: Subscription[] = [];
  widgetInfo: {[key: string]: any};
  isRequired = false;

  liveAnnouncer: LiveAnnouncer = inject(LiveAnnouncer);
  errors: WidgetValidationError[] | null = null;

  // Replace standard error messages from schema validator with customized messages.
  // Keys are error codes from the validator.
  modifiedMessages: ModifiedMessages = DEFAULT_WIDGET_MODIFIED_MESSAGES;

  ngOnInit() {
    // Determine if this field is required.
    this.isRequired = Util.getIsRequired(this.formProperty);
    const widget = this.formProperty.schema.widget;
    this.widgetInfo = widget || {};
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

  protected subscribeToErrors() {
    const sub = this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = mapWidgetErrors(errors, this.modifiedMessages, {
        showEmptyError: !!this.schema.widget.showEmptyError
      });
    });
    this.subscriptions.push(sub);
  }


  /**
   * Clear all subscriptions.
   */
  unsubscribe() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.subscriptions = [];
  }

  /**
   * Implement OnDestroy
   */
  ngOnDestroy() {
    this.unsubscribe();
  }

  /**
   * Replace the standard schema validator error message with the customized message.
   * @param pattern - Pattern as specified in the schema to identify the replacement message.
   */
  getModifiedErrorForPatternMismatch(pattern: string): string | null {
    return getModifiedErrorForPatternMismatch(pattern, this.modifiedMessages);
  }

  /**
   * Check for errors when the field is focused and announce any existing errors.
   */
  announceErrors(): void {
    if(this.errors) {
      const combinedErrorMessage = this.errors.reduce((acc, error) => acc + error.originalMessage, '');
      this.liveAnnouncer.announce(combinedErrorMessage);
    }
  }
}
