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
    PATTERN: {
      '^\\S*$': 'Spaces and other whitespace characters are not allowed in this field.', // uri
      '^[^\\s]+(\\s[^\\s]+)*$': 'Spaces are not allowed at the beginning or end.',       // code
    },
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
          const modifiedMessage = e.code === 'PATTERN' ? this.modifiedMessages.PATTERN[e.params[0]] : this.modifiedMessages[e.code];
          return {code: e.code, originalMessage: e.message, modifiedMessage};
        });
      }
    });
  }
}
