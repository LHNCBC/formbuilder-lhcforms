/**
 * Customize array-widget from ngx-schema-form.
 */
import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlWidget} from '@lhncbc/ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {Subscription} from 'rxjs';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  standalone: false,
  selector: 'lfb-control-widget',
  template: `
  `,
  styles: [
  ]
})
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

  liveAnnouncer: LiveAnnouncer = inject(LiveAnnouncer);
  errors: { code: string, originalMessage: string, modifiedMessage: string }[] = null;

  // Replace standard error messages from schema validator with customized messages.
  // Keys are error codes from the validator.
  modifiedMessages = {
    PATTERN: [
      {
        pattern: "^[A-Za-z0-9\\-\\.]{1,64}$",
        message: 'Only alphanumeric, hyphen and period characters are allowed in this field. Make sure any white space characters are not used.'
      }, // id
      {
        pattern: '^\\S*$',
        message: 'Spaces and other whitespace characters are not allowed in this field.'
      }, // uri
      {
        pattern: '^[^\\s]+(\\s[^\\s]+)*$',
        message: 'Spaces are not allowed at the beginning or end.'
      },       // code
      {
        pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$',
        message: 'Valid format is yyyy-MM-dd.'
      }, // Date
      {
        pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$',
        message: 'Valid format is yyyy-MM-dd hh:mm:ss (AM|PM).'
      } // Datetime
    ],
    MIN_LENGTH: null,
    MAX_LENGTH: null
  }

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
  getModifiedErrorForPatternMismatch(pattern: string): string {
    const messageObj = this.modifiedMessages.PATTERN.find((el) => {
      return el.pattern === pattern;
    });
    return messageObj ? messageObj.message : null;
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
