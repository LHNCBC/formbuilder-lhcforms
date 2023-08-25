/**
 * Component for general input box
 */
import {AfterViewInit, Component, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-string',
  templateUrl: './string.component.html'
})
export class StringComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {

  modifiedMessages = {
    PATTERN: [
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
        message: 'Valid format is yyyy-MM-dd'
      }, // Date
      {
        pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$',
        message: 'Valid format is yyyy-MM-dd hh:mm:ss (AM|PM)'
      } // Datetime
    ],
    MIN_LENGTH: null,
    MAX_LENGTH: null
  }
  errors: {code: string, originalMessage: string, modifiedMessage: string} [] = null;

  ngOnInit() {
    super.ngOnInit();
    this.controlClasses = this.controlClasses || 'form-control form-control-sm';
  }

  /**
   * Add formProperty change subscriptions.
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
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
          const modifiedMessage = e.code === 'PATTERN'
            ? this.getModifiedErrorForPatternMismatch(e.params[0])
            : this.modifiedMessages[e.code];
          return {code: e.code, originalMessage: e.message, modifiedMessage};
        });
      }
    });
  }

  getModifiedErrorForPatternMismatch(pattern: string): string {
    const messageObj = this.modifiedMessages.PATTERN.find((el) => {
      return el.pattern === pattern;
    });
    return messageObj ? messageObj.message : null;
  }
}
