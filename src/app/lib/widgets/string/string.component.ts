/**
 * Component for general input box
 */
import {Component, inject, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  standalone: false,
  selector: 'lfb-string',
  templateUrl: './string.component.html'
})
export class StringComponent extends LfbControlWidgetComponent implements OnInit {

  liveAnnouncer = inject(LiveAnnouncer);

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
  errors: {code: string, originalMessage: string, modifiedMessage: string} [] = null;

  Array = Array; // To use in templates.

  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.controlClasses = this.controlClasses || 'form-control form-control-sm';
    this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = null;
      if(errors?.length) {
        // For some reason, errors have duplicates. Remove them.
        const errorsObj = {};
        errors.reduce((acc, error) => {
          if(!acc[error.code]) {
            acc[error.code] = error;
          }
          return acc;
        }, errorsObj);
        this.errors = Object.values(errorsObj).map((e: any) => {
          let ret = {code: e.code, originalMessage: e.message, modifiedMessage: null};
          if(!e.params[1]?.trim() && this.schema.widget.showEmptyError) {
            // If the error is caused by an empty value, use a generic message.
            ret.code = 'EMPTY_ERROR';
            ret.modifiedMessage = 'This field is required.';
          } else {
            const modifiedMessage = e.code === 'PATTERN'
              ? this.getModifiedErrorForPatternMismatch(e.params[0])
              : this.modifiedMessages[e.code];
            ret.code = e.code;
            ret.originalMessage = e.message;
            ret.modifiedMessage = modifiedMessage;
          }
          return ret;
        });
      }
    });
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
